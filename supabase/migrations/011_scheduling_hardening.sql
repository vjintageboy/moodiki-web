-- -------------------------------------------------------------
-- SCHEDULING SYSTEM REDESIGN & HARDENING
-- Resolves: Partial overlaps, Timezones, RLS trust, Constraints
-- -------------------------------------------------------------

-- 1. ADD VALIDATION CONSTRAINTS -------------------------------
-- Ensure duration is at least 15 minutes
ALTER TABLE public.expert_availability 
DROP CONSTRAINT IF EXISTS valid_duration_minimum;

ALTER TABLE public.expert_availability 
ADD CONSTRAINT valid_duration_minimum 
CHECK (end_time >= start_time + interval '15 minutes');

-- Ensure start_time is in the future (Trigger required because NOW() is not immutable)
CREATE OR REPLACE FUNCTION check_future_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_time <= NOW() THEN
    RAISE EXCEPTION 'Cannot schedule availability in the past';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_past_availability_slots_trg ON public.expert_availability;
CREATE TRIGGER prevent_past_availability_slots_trg
BEFORE INSERT OR UPDATE ON public.expert_availability
FOR EACH ROW EXECUTE FUNCTION check_future_availability();

-- 2. SECURE API FOR CREATING AVAILABILITY ---------------------
-- Client sends start and end. Server injects auth.uid() automatically.
CREATE OR REPLACE FUNCTION public.add_expert_availability(
  p_start_time timestamptz,
  p_end_time timestamptz
)
RETURNS public.expert_availability
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expert_id uuid;
  v_inserted_row public.expert_availability;
BEGIN
  v_expert_id := auth.uid();
  IF v_expert_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Must be logged in';
  END IF;

  -- Ensure expert actually exists (and is verified if you wanted tighter rules)
  IF NOT EXISTS (SELECT 1 FROM public.experts WHERE id = v_expert_id) THEN
    RAISE EXCEPTION 'Unauthorized: User is not configured as an expert';
  END IF;

  INSERT INTO public.expert_availability (expert_id, start_time, end_time)
  VALUES (v_expert_id, p_start_time, p_end_time)
  RETURNING * INTO v_inserted_row;

  RETURN v_inserted_row;
END;
$$;

-- 3. ALGORITHM: PARTIAL OVERLAP SCHEDULE SPLITTING ------------
-- Returns JSON payload with { slots: [{start, end}], nextAvailableDate: "..." }
CREATE OR REPLACE FUNCTION public.get_split_available_slots(
  p_expert_id uuid,
  p_date date,
  p_timezone text DEFAULT 'Asia/Ho_Chi_Minh'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_avail record;
  v_appt record;
  v_chunks tstzrange[];
  v_new_chunks tstzrange[];
  v_chunk tstzrange;
  v_booked tstzrange;
  v_result JSONB := '[]'::jsonb;
  v_final_slots JSONB := '[]'::jsonb;
  v_next_date date;
BEGIN
  -- 1) Gather pure availability blocks for the requested localized date
  FOR v_avail IN 
    SELECT start_time, end_time 
    FROM public.expert_availability 
    WHERE expert_id = p_expert_id
      -- Using TIMEZONE cast to ensure boundaries match local timezone target
      AND DATE(start_time AT TIME ZONE p_timezone) = p_date
    ORDER BY start_time ASC
  LOOP
    v_chunks := ARRAY[tstzrange(v_avail.start_time, v_avail.end_time)];

    -- For each availability, find all appointments that potentially intersect
    FOR v_appt IN 
      SELECT appointment_date as start, appointment_date + (duration_minutes || ' minutes')::interval as "end"
      FROM public.appointments
      WHERE expert_id = p_expert_id
        AND status IN ('pending', 'confirmed')
        AND appointment_date < v_avail.end_time
        AND (appointment_date + (duration_minutes || ' minutes')::interval) > v_avail.start_time
    LOOP
      v_booked := tstzrange(v_appt.start, v_appt.end);
      v_new_chunks := ARRAY[]::tstzrange[];

      -- Iterate existing chunks to slice around booked times
      FOREACH v_chunk IN ARRAY v_chunks LOOP
        IF v_chunk && v_booked THEN
          -- Keep left side of the split if valid
          IF lower(v_chunk) < lower(v_booked) THEN
            v_new_chunks := array_append(v_new_chunks, tstzrange(lower(v_chunk), lower(v_booked)));
          END IF;
          -- Keep right side of the split if valid
          IF upper(v_chunk) > upper(v_booked) THEN
            v_new_chunks := array_append(v_new_chunks, tstzrange(upper(v_booked), upper(v_chunk)));
          END IF;
        ELSE
          -- No intersection, keep unmodified
          v_new_chunks := array_append(v_new_chunks, v_chunk);
        END IF;
      END LOOP;
      v_chunks := v_new_chunks;
    END LOOP;

    -- Inject final processed chunks into result payload
    FOREACH v_chunk IN ARRAY v_chunks LOOP
      v_final_slots := v_final_slots || jsonb_build_object(
        'start_time', lower(v_chunk),
        'end_time', upper(v_chunk)
      );
    END LOOP;
  END LOOP;

  -- 2) Empty State Handling (UX Requirement)
  IF jsonb_array_length(v_final_slots) = 0 THEN
    -- Look precisely for the NEXT upcoming distinct availability calendar date
    SELECT DATE(start_time AT TIME ZONE p_timezone) INTO v_next_date
    FROM public.expert_availability
    WHERE expert_id = p_expert_id
      AND DATE(start_time AT TIME ZONE p_timezone) > p_date
      AND start_time > NOW()
    ORDER BY start_time ASC
    LIMIT 1;

    RETURN jsonb_build_object(
      'slots', '[]'::jsonb,
      'nextAvailableDate', COALESCE(to_char(v_next_date, 'YYYY-MM-DD'), null)
    );
  END IF;

  RETURN jsonb_build_object(
    'slots', v_final_slots,
    'nextAvailableDate', null
  );
END;
$$;

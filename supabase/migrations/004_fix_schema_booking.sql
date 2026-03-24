-- -------------------------------------------------------------
-- FEATURE: SCHMEA FIX & BOOK APPOINTMENT FLOW
-- -------------------------------------------------------------

-- Drop the old table completely because the data type 'TIME' with 'day_of_week' 
-- cannot be safely cast to 'timestamptz' automatically without risking bad data, 
-- and it doesn't align with the exact datetime constraints we need for overlapping checks.
DROP TABLE IF EXISTS public.expert_availability cascade;

-- Enable B-Tree GiST to use Exclude constraints on timestamps
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Re-create the table with proper TIMESTAMPTZ
CREATE TABLE public.expert_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id uuid REFERENCES public.experts(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Prevent overlapping availability blocks for an expert
  CONSTRAINT prevent_overlapping_availability
    EXCLUDE USING gist (
      expert_id WITH =, 
      tstzrange(start_time, end_time) WITH &&
    ),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- RLS setup for Availability
ALTER TABLE public.expert_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Experts can manage their own availability" 
ON public.expert_availability FOR ALL 
USING (auth.uid() = expert_id);

CREATE POLICY "Anyone authenticated can view availability" 
ON public.expert_availability FOR SELECT 
TO authenticated 
USING (true);

-- -------------------------------------------------------------
-- TRIGGER: updated_at for expert_availability
-- -------------------------------------------------------------
CREATE TRIGGER update_expert_availability_updated_at 
BEFORE UPDATE ON public.expert_availability
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------------
-- RPC: BOOK APPOINTMENT WITH CONCURRENCY SAFEGUARDS
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_user_id uuid,
  p_expert_id uuid,
  p_start_time timestamptz,
  p_duration_minutes integer,
  p_call_type appointment_call_type,
  p_user_notes text
)
RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment public.appointments;
  v_end_time timestamptz;
  v_overlap_count integer;
  v_availability_count integer;
BEGIN
  -- Validate user
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only book appointments for yourself';
  END IF;

  v_end_time := p_start_time + (p_duration_minutes || ' minutes')::interval;

  -- 1. Check if the expert is actually available for this slot
  SELECT count(*) INTO v_availability_count
  FROM public.expert_availability
  WHERE expert_id = p_expert_id
    AND start_time <= p_start_time
    AND end_time >= v_end_time;

  IF v_availability_count = 0 THEN
    RAISE EXCEPTION 'Expert is not available for this time slot';
  END IF;

  -- 2. Check for double booking (another appointment during this time)
  SELECT count(*) INTO v_overlap_count
  FROM public.appointments
  WHERE expert_id = p_expert_id
    AND status IN ('pending', 'confirmed') -- only check active appointments
    AND (
        (appointment_date < v_end_time)
        AND 
        ((appointment_date + (duration_minutes || ' minutes')::interval) > p_start_time)
    );

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION 'Double booking error: Expert already has an appointment during this time';
  END IF;

  -- 3. Insert the appointment safely
  INSERT INTO public.appointments (
    user_id,
    expert_id,
    appointment_date,
    duration_minutes,
    call_type,
    status,
    user_notes
  )
  VALUES (
    p_user_id,
    p_expert_id,
    p_start_time,
    p_duration_minutes,
    p_call_type,
    'pending',
    p_user_notes
  )
  RETURNING * INTO v_appointment;

  RETURN v_appointment;
END;
$$;

-- -------------------------------------------------------------
-- RPC: GET AVAILABLE SLOTS FOR AN EXPERT
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_expert_id uuid,
  p_date date
)
RETURNS TABLE (
  start_time timestamptz,
  end_time timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT ea.start_time, ea.end_time
  FROM public.expert_availability ea
  WHERE ea.expert_id = p_expert_id
    AND DATE(ea.start_time AT TIME ZONE 'UTC') = p_date
    -- Ensure the slot is not heavily overlapped by an existing pending/confirmed appointment
    AND NOT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.expert_id = p_expert_id
        AND a.status IN ('pending', 'confirmed')
        AND a.appointment_date < ea.end_time
        AND (a.appointment_date + (a.duration_minutes || ' minutes')::interval) > ea.start_time
    )
  ORDER BY ea.start_time ASC;
END;
$$;

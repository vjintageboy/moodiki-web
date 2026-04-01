-- -------------------------------------------------------------
-- FEATURE: BULK SCHEDULING GENERATOR
-- Allows experts to ingest complex weekly schedules for 
-- N weeks efficiently via a single batched database transaction.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.add_expert_availability_bulk(
  p_slots jsonb
)
RETURNS SETOF public.expert_availability
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expert_id uuid;
BEGIN
  -- Strict RLS security inheritance: Ensure logged in
  v_expert_id := auth.uid();
  IF v_expert_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Must be logged in';
  END IF;
  
  -- Verify domain legitimacy
  IF NOT EXISTS (SELECT 1 FROM public.experts WHERE id = v_expert_id) THEN
    RAISE EXCEPTION 'Unauthorized: User is not configured as an expert';
  END IF;

  -- Process the entire array natively inside the relational engine
  RETURN QUERY 
    INSERT INTO public.expert_availability (expert_id, start_time, end_time)
    SELECT 
      v_expert_id, 
      (slot->>'start_time')::timestamptz, 
      (slot->>'end_time')::timestamptz
    FROM jsonb_array_elements(p_slots) AS slot
    RETURNING *;
END;
$$;

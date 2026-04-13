-- Migration 016: Expert access to patient mood entries
-- Purpose: Allow experts to view mood_entries of their patients (users they have appointments with)

-- Policy: Experts can view mood entries of users they have had appointments with
CREATE POLICY "Experts can view patient mood entries"
  ON public.mood_entries
  FOR SELECT
  USING (
    user_id IN (
      SELECT DISTINCT a.user_id
      FROM public.appointments a
      WHERE a.expert_id IN (
        SELECT e.id FROM public.experts e WHERE e.id = auth.uid()
      )
      AND a.status IN ('completed', 'confirmed', 'pending')
    )
  );

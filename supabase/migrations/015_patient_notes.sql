-- Migration 015: Patient Notes for Experts
-- Purpose: Allow experts to save internal notes about their patients

-- Create patient_notes table
CREATE TABLE IF NOT EXISTS public.patient_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure one note per expert-patient pair
  UNIQUE(expert_id, patient_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_notes_expert ON public.patient_notes(expert_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_patient ON public.patient_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_expert_patient ON public.patient_notes(expert_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_updated ON public.patient_notes(updated_at DESC);

-- RLS (Row Level Security) Policies
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;

-- Experts can only see their own notes
CREATE POLICY "Experts can view own patient notes"
  ON public.patient_notes
  FOR SELECT
  USING (
    expert_id IN (
      SELECT id FROM public.experts 
      WHERE id = auth.uid()
    )
  );

-- Experts can insert their own notes
CREATE POLICY "Experts can create own patient notes"
  ON public.patient_notes
  FOR INSERT
  WITH CHECK (
    expert_id IN (
      SELECT id FROM public.experts 
      WHERE id = auth.uid()
    )
  );

-- Experts can update their own notes
CREATE POLICY "Experts can update own patient notes"
  ON public.patient_notes
  FOR UPDATE
  USING (
    expert_id IN (
      SELECT id FROM public.experts 
      WHERE id = auth.uid()
    )
  );

-- Experts can delete their own notes
CREATE POLICY "Experts can delete own patient notes"
  ON public.patient_notes
  FOR DELETE
  USING (
    expert_id IN (
      SELECT id FROM public.experts 
      WHERE id = auth.uid()
    )
  );

-- Admins can view all notes (for moderation if needed)
CREATE POLICY "Admins can view all patient notes"
  ON public.patient_notes
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role = 'admin'
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_patient_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patient_notes_updated_at
  BEFORE UPDATE ON public.patient_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_notes_updated_at();

-- Migration: Add rejection_reason column to experts table
-- Used by the soft-reject flow in the admin approval workflow

ALTER TABLE experts
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;

-- Optional: index for quickly looking up rejected experts
CREATE INDEX IF NOT EXISTS experts_rejection_reason_idx
  ON experts (id)
  WHERE rejection_reason IS NOT NULL;

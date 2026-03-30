-- Migration 010_admin_features.sql
-- Adds missing functionality for the Admin Dashboard extensions

-- Feature 1: User Lock/Unlock
-- Adds is_locked to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- Feature 2: Reports System
-- Creates the reports table for Community Posts
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster filtering of reports per post
CREATE INDEX IF NOT EXISTS idx_reports_post_id ON reports(post_id);

-- Feature 3: Gemini AI Moderation flag
-- Adds flagged status to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE;

-- Enable RLS for reports table and set basic policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Admins can read all reports
CREATE POLICY "Admins can view all reports" ON reports
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Authenticated users can insert reports
CREATE POLICY "Users can create reports" ON reports
    FOR INSERT TO authenticated
    WITH CHECK (true);

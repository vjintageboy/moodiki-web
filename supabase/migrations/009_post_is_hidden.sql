-- Migration 009: Add is_hidden column to posts table for soft moderation
-- Allows admins to hide posts without permanently deleting them

ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Index for efficient filtering of hidden/visible posts
CREATE INDEX IF NOT EXISTS idx_posts_is_hidden ON posts(is_hidden);

COMMENT ON COLUMN posts.is_hidden IS 'Admin soft-moderation flag. true = post hidden from public feed, false = visible.';

-- Mental Health Admin Panel - Initial Database Schema
-- Supabase PostgreSQL Migration
-- Created: 2024
-- This migration creates all necessary tables for the Mental Health Admin Panel

-- =====================================================
-- 1. ENUM TYPES
-- =====================================================

-- User role enum
CREATE TYPE user_role AS ENUM ('admin', 'expert', 'user');

-- Appointment call type enum
CREATE TYPE appointment_call_type AS ENUM ('chat', 'video', 'audio');

-- Appointment status enum
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- AI message role enum
CREATE TYPE ai_message_role AS ENUM ('user', 'assistant', 'system');

-- =====================================================
-- 2. USERS TABLE
-- =====================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  streak_count INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  date_of_birth TIMESTAMP WITH TIME ZONE,
  gender VARCHAR(50),
  goals TEXT[],
  preferences JSONB DEFAULT '{}'::jsonb,
  last_login TIMESTAMP WITH TIME ZONE,
  total_activities INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_streak CHECK (streak_count >= 0),
  CONSTRAINT valid_longest_streak CHECK (longest_streak >= 0),
  CONSTRAINT valid_total_activities CHECK (total_activities >= 0)
);

-- Indexes on users table
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);
CREATE INDEX idx_users_last_login ON public.users(last_login DESC);

-- =====================================================
-- 3. EXPERTS TABLE
-- =====================================================

CREATE TABLE public.experts (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  specialization VARCHAR(255),
  hourly_rate INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT false,
  years_experience INTEGER DEFAULT 0,
  license_number VARCHAR(255),
  license_url TEXT,
  certificate_urls TEXT[],
  education VARCHAR(255),
  university VARCHAR(255),
  graduation_year INTEGER,
  title VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_hourly_rate CHECK (hourly_rate >= 0),
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT valid_total_reviews CHECK (total_reviews >= 0),
  CONSTRAINT valid_years_experience CHECK (years_experience >= 0)
);

-- Indexes on experts table
CREATE INDEX idx_experts_is_approved ON public.experts(is_approved);
CREATE INDEX idx_experts_specialization ON public.experts(specialization);
CREATE INDEX idx_experts_created_at ON public.experts(created_at DESC);

-- =====================================================
-- 4. EXPERT AVAILABILITY TABLE
-- =====================================================

CREATE TABLE public.expert_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Indexes on expert_availability table
CREATE INDEX idx_expert_availability_expert_id ON public.expert_availability(expert_id);
CREATE INDEX idx_expert_availability_day ON public.expert_availability(expert_id, day_of_week);

-- =====================================================
-- 5. APPOINTMENTS TABLE
-- =====================================================

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  call_type appointment_call_type NOT NULL,
  status appointment_status DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  payment_id VARCHAR(255),
  payment_trans_id VARCHAR(255),
  expert_base_price INTEGER,
  user_notes TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  cancelled_role VARCHAR(50),
  cancellation_reason TEXT,
  refund_status VARCHAR(50) DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_duration CHECK (duration_minutes > 0),
  CONSTRAINT valid_expert_base_price CHECK (expert_base_price IS NULL OR expert_base_price >= 0)
);

-- Indexes on appointments table
CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_expert_id ON public.appointments(expert_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_payment_status ON public.appointments(payment_status);
CREATE INDEX idx_appointments_appointment_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_created_at ON public.appointments(created_at DESC);

-- =====================================================
-- 6. MEDITATIONS TABLE
-- =====================================================

CREATE TABLE public.meditations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(255),
  duration_minutes INTEGER,
  audio_url TEXT NOT NULL,
  thumbnail_url TEXT,
  level VARCHAR(50) DEFAULT 'beginner',
  rating NUMERIC(3, 2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_duration CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT valid_total_reviews CHECK (total_reviews >= 0)
);

-- Indexes on meditations table
CREATE INDEX idx_meditations_category ON public.meditations(category);
CREATE INDEX idx_meditations_level ON public.meditations(level);
CREATE INDEX idx_meditations_created_at ON public.meditations(created_at DESC);

-- =====================================================
-- 7. MOOD ENTRIES TABLE
-- =====================================================

CREATE TABLE public.mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mood_score INTEGER NOT NULL,
  note TEXT,
  emotion_factors TEXT[],
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_mood_score CHECK (mood_score >= 1 AND mood_score <= 5)
);

-- Indexes on mood_entries table
CREATE INDEX idx_mood_entries_user_id ON public.mood_entries(user_id);
CREATE INDEX idx_mood_entries_created_at ON public.mood_entries(created_at DESC);
CREATE INDEX idx_mood_entries_user_date ON public.mood_entries(user_id, created_at DESC);

-- =====================================================
-- 8. POSTS TABLE (Community Forum)
-- =====================================================

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  category VARCHAR(255) DEFAULT 'community',
  is_anonymous BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_likes_count CHECK (likes_count >= 0),
  CONSTRAINT valid_comment_count CHECK (comment_count >= 0)
);

-- Indexes on posts table
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_category ON public.posts(category);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);

-- =====================================================
-- 9. POST COMMENTS TABLE
-- =====================================================

CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes on post_comments table
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX idx_post_comments_parent_id ON public.post_comments(parent_comment_id);
CREATE INDEX idx_post_comments_created_at ON public.post_comments(created_at DESC);

-- =====================================================
-- 10. POST LIKES TABLE
-- =====================================================

CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Unique constraint: one like per user per post
  UNIQUE(post_id, user_id)
);

-- Indexes on post_likes table
CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);

-- =====================================================
-- 11. CHAT ROOMS TABLE
-- =====================================================

CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active',
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes on chat_rooms table
CREATE INDEX idx_chat_rooms_appointment_id ON public.chat_rooms(appointment_id);
CREATE INDEX idx_chat_rooms_status ON public.chat_rooms(status);
CREATE INDEX idx_chat_rooms_created_at ON public.chat_rooms(created_at DESC);

-- =====================================================
-- 12. MESSAGES TABLE
-- =====================================================

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'text',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes on messages table
CREATE INDEX idx_messages_room_id ON public.messages(room_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_room_time ON public.messages(room_id, created_at DESC);

-- =====================================================
-- 13. CHAT PARTICIPANTS TABLE
-- =====================================================

CREATE TABLE public.chat_participants (
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  PRIMARY KEY (room_id, user_id)
);

-- Indexes on chat_participants table
CREATE INDEX idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX idx_chat_participants_room_user ON public.chat_participants(room_id, user_id);

-- =====================================================
-- 14. AI CONVERSATIONS TABLE
-- =====================================================

CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  last_message_preview TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes on ai_conversations table
CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_created_at ON public.ai_conversations(created_at DESC);
CREATE INDEX idx_ai_conversations_is_archived ON public.ai_conversations(is_archived);

-- =====================================================
-- 15. AI MESSAGES TABLE
-- =====================================================

CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role ai_message_role NOT NULL,
  content TEXT NOT NULL,
  model_name VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_prompt_tokens CHECK (prompt_tokens IS NULL OR prompt_tokens >= 0),
  CONSTRAINT valid_completion_tokens CHECK (completion_tokens IS NULL OR completion_tokens >= 0),
  CONSTRAINT valid_total_tokens CHECK (total_tokens IS NULL OR total_tokens >= 0),
  CONSTRAINT valid_latency_ms CHECK (latency_ms IS NULL OR latency_ms >= 0)
);

-- Indexes on ai_messages table
CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_user_id ON public.ai_messages(user_id);
CREATE INDEX idx_ai_messages_role ON public.ai_messages(role);
CREATE INDEX idx_ai_messages_created_at ON public.ai_messages(created_at DESC);
CREATE INDEX idx_ai_messages_conversation_time ON public.ai_messages(conversation_id, created_at DESC);

-- =====================================================
-- 16. NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(100),
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes on notifications table
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read);

-- =====================================================
-- 17. UPDATED_AT TRIGGERS
-- =====================================================
-- This section creates automatic updated_at timestamp triggers

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experts_updated_at BEFORE UPDATE ON public.experts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expert_availability_updated_at BEFORE UPDATE ON public.expert_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meditations_updated_at BEFORE UPDATE ON public.meditations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mood_entries_updated_at BEFORE UPDATE ON public.mood_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON public.chat_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 18. COMMENTS
-- =====================================================
-- Migration notes:
-- - All tables use UUID primary keys with gen_random_uuid()
-- - Foreign key constraints use ON DELETE CASCADE for data integrity
-- - ENUM types are used for constrained string values
-- - JSONB columns used for flexible metadata storage
-- - Indexes created on frequently queried columns (user_id, expert_id, status, created_at, etc.)
-- - CHECK constraints ensure data validity
-- - Automatic updated_at timestamps via triggers
-- - RLS policies are NOT enabled in this migration (handle separately for security)

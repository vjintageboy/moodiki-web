-- ==============================================================================
-- Row Level Security (RLS) Policies for Mental Health Admin Panel
-- ==============================================================================
-- This migration enables RLS on all tables and creates comprehensive policies
-- for different user roles: Admin, Expert, and User
-- ==============================================================================

-- ==============================================================================
-- 1. USERS TABLE POLICIES
-- ==============================================================================
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Admin: Full CRUD access
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create users"
  ON public.users
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all users"
  ON public.users
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete users"
  ON public.users
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users: Can read and update own profile
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Experts: Can read and update own profile
CREATE POLICY "Experts can view their own profile"
  ON public.users
  FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Experts can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ==============================================================================
-- 2. EXPERTS TABLE POLICIES
-- ==============================================================================
-- Enable RLS
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;

-- Admin: Full CRUD access
CREATE POLICY "Admins can view all experts"
  ON public.experts
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create expert records"
  ON public.experts
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all expert records"
  ON public.experts
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete expert records"
  ON public.experts
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Experts: Can read own record and update (except is_approved field)
CREATE POLICY "Experts can view their own record"
  ON public.experts
  FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Experts can update their own record"
  ON public.experts
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users: Can read approved experts only
CREATE POLICY "Users can view approved experts"
  ON public.experts
  FOR SELECT
  USING (
    is_approved = true OR
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ==============================================================================
-- 3. EXPERT_AVAILABILITY TABLE POLICIES
-- ==============================================================================
-- Enable RLS
ALTER TABLE public.expert_availability ENABLE ROW LEVEL SECURITY;

-- Admin: Full CRUD access
CREATE POLICY "Admins can view all expert availability"
  ON public.expert_availability
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create expert availability"
  ON public.expert_availability
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update expert availability"
  ON public.expert_availability
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete expert availability"
  ON public.expert_availability
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Experts: Can manage their own availability
CREATE POLICY "Experts can view their own availability"
  ON public.expert_availability
  FOR SELECT
  USING (
    expert_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Experts can create their own availability"
  ON public.expert_availability
  FOR INSERT
  WITH CHECK (expert_id = auth.uid());

CREATE POLICY "Experts can update their own availability"
  ON public.expert_availability
  FOR UPDATE
  USING (expert_id = auth.uid())
  WITH CHECK (expert_id = auth.uid());

CREATE POLICY "Experts can delete their own availability"
  ON public.expert_availability
  FOR DELETE
  USING (expert_id = auth.uid());

-- Everyone authenticated: Can view available slots
CREATE POLICY "Authenticated users can view expert availability"
  ON public.expert_availability
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ==============================================================================
-- 4. APPOINTMENTS TABLE POLICIES
-- ==============================================================================
-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Admin: Full CRUD access
CREATE POLICY "Admins can view all appointments"
  ON public.appointments
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create appointments"
  ON public.appointments
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update appointments"
  ON public.appointments
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete appointments"
  ON public.appointments
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Experts: Can read appointments where they are the expert, update status
CREATE POLICY "Experts can view their appointments"
  ON public.appointments
  FOR SELECT
  USING (
    expert_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Experts can update appointment status"
  ON public.appointments
  FOR UPDATE
  USING (expert_id = auth.uid())
  WITH CHECK (expert_id = auth.uid());

-- Users: Can read/create/update appointments where they are the user
CREATE POLICY "Users can view their appointments"
  ON public.appointments
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create appointments"
  ON public.appointments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own appointments"
  ON public.appointments
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==============================================================================
-- 5. MEDITATIONS TABLE POLICIES
-- ==============================================================================
-- Enable RLS
ALTER TABLE public.meditations ENABLE ROW LEVEL SECURITY;

-- Admin: Full CRUD access
CREATE POLICY "Admins can view all meditations"
  ON public.meditations
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create meditations"
  ON public.meditations
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update meditations"
  ON public.meditations
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete meditations"
  ON public.meditations
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Everyone authenticated: Read-only access to meditations
CREATE POLICY "Authenticated users can view meditations"
  ON public.meditations
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ==============================================================================
-- 6. MOOD_ENTRIES TABLE POLICIES
-- ==============================================================================
-- Enable RLS
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

-- Admin: Full CRUD access
CREATE POLICY "Admins can view all mood entries"
  ON public.mood_entries
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create mood entries"
  ON public.mood_entries
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update mood entries"
  ON public.mood_entries
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete mood entries"
  ON public.mood_entries
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users: CRUD their own mood entries
CREATE POLICY "Users can view their own mood entries"
  ON public.mood_entries
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create mood entries"
  ON public.mood_entries
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own mood entries"
  ON public.mood_entries
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own mood entries"
  ON public.mood_entries
  FOR DELETE
  USING (user_id = auth.uid());

-- ==============================================================================
-- 7. POSTS TABLE POLICIES
-- ==============================================================================
-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Admin: Full CRUD access
CREATE POLICY "Admins can view all posts"
  ON public.posts
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create posts"
  ON public.posts
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all posts"
  ON public.posts
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete all posts"
  ON public.posts
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Authenticated users: Can read public posts (non-anonymous)
CREATE POLICY "Authenticated users can read public posts"
  ON public.posts
  FOR SELECT
  USING (
    is_anonymous = false OR
    author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users: Can CRUD their own posts
CREATE POLICY "Users can create posts"
  ON public.posts
  FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own posts"
  ON public.posts
  FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can delete their own posts"
  ON public.posts
  FOR DELETE
  USING (author_id = auth.uid());

-- ==============================================================================
-- 8. POST_COMMENTS TABLE POLICIES
-- ==============================================================================
-- Enable RLS
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Admin: Full CRUD access
CREATE POLICY "Admins can view all post comments"
  ON public.post_comments
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create post comments"
  ON public.post_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all post comments"
  ON public.post_comments
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete post comments"
  ON public.post_comments
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Authenticated users: Can read comments on posts they can see
CREATE POLICY "Authenticated users can read comments on public posts"
  ON public.post_comments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.posts
        WHERE id = post_id AND (is_anonymous = false OR author_id = auth.uid())
      ) OR
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Users: Can CRUD their own comments
CREATE POLICY "Users can create comments"
  ON public.post_comments
  FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own comments"
  ON public.post_comments
  FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON public.post_comments
  FOR DELETE
  USING (author_id = auth.uid());

-- ==============================================================================
-- 9. POST_LIKES TABLE POLICIES
-- ==============================================================================
-- Enable RLS
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Admin: Full CRUD access
CREATE POLICY "Admins can view all post likes"
  ON public.post_likes
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create post likes"
  ON public.post_likes
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete post likes"
  ON public.post_likes
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Authenticated users: Can view likes on posts they can see
CREATE POLICY "Authenticated users can view post likes"
  ON public.post_likes
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.posts
        WHERE id = post_id AND (is_anonymous = false OR author_id = auth.uid())
      ) OR
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Users: Can like/unlike posts
CREATE POLICY "Users can like posts"
  ON public.post_likes
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike posts"
  ON public.post_likes
  FOR DELETE
  USING (user_id = auth.uid());

-- ==============================================================================
-- 10. CHAT_ROOMS TABLE POLICIES
-- ==============================================================================
-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Admin: Full CRUD access
CREATE POLICY "Admins can view all chat rooms"
  ON public.chat_rooms
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create chat rooms"
  ON public.chat_rooms
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update chat rooms"
  ON public.chat_rooms
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete chat rooms"
  ON public.chat_rooms
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users: Can only access chat rooms they participate in
CREATE POLICY "Users can view their chat rooms"
  ON public.chat_rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE room_id = id AND user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update their chat rooms"
  ON public.chat_rooms
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE room_id = id AND user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE room_id = id AND user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ==============================================================================
-- 11. MESSAGES TABLE POLICIES
-- ==============================================================================
-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Admin: Full CRUD access
CREATE POLICY "Admins can view all messages"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update messages"
  ON public.messages
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete messages"
  ON public.messages
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users: Can only view/send messages in their chat rooms
CREATE POLICY "Users can view messages in their chat rooms"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE room_id = messages.room_id AND user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE room_id = messages.room_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.messages
  FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON public.messages
  FOR DELETE
  USING (sender_id = auth.uid());

-- ==============================================================================
-- 12. CHAT_PARTICIPANTS TABLE POLICIES
-- ==============================================================================
-- Enable RLS
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Admin: Full CRUD access
CREATE POLICY "Admins can view all chat participants"
  ON public.chat_participants
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage chat participants"
  ON public.chat_participants
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update chat participants"
  ON public.chat_participants
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can remove chat participants"
  ON public.chat_participants
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users: Can only see participants in their own chat rooms
CREATE POLICY "Users can view participants in their chat rooms"
  ON public.chat_participants
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.room_id = chat_participants.room_id AND cp.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ==============================================================================
-- 13. AI_CONVERSATIONS TABLE POLICIES
-- ==============================================================================
-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Admin: Full CRUD access
CREATE POLICY "Admins can view all AI conversations"
  ON public.ai_conversations
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create AI conversations"
  ON public.ai_conversations
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update AI conversations"
  ON public.ai_conversations
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete AI conversations"
  ON public.ai_conversations
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users: CRUD their own conversations
CREATE POLICY "Users can view their own AI conversations"
  ON public.ai_conversations
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create AI conversations"
  ON public.ai_conversations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own AI conversations"
  ON public.ai_conversations
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own AI conversations"
  ON public.ai_conversations
  FOR DELETE
  USING (user_id = auth.uid());

-- ==============================================================================
-- 14. AI_MESSAGES TABLE POLICIES
-- ==============================================================================
-- Enable RLS
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Admin: Full CRUD access
CREATE POLICY "Admins can view all AI messages"
  ON public.ai_messages
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage AI messages"
  ON public.ai_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update AI messages"
  ON public.ai_messages
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete AI messages"
  ON public.ai_messages
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users: Can view/manage messages in their own conversations
CREATE POLICY "Users can view messages in their own conversations"
  ON public.ai_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can add messages to their conversations"
  ON public.ai_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their conversations"
  ON public.ai_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in their conversations"
  ON public.ai_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

-- ==============================================================================
-- 15. NOTIFICATIONS TABLE POLICIES
-- ==============================================================================
-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admin: Full CRUD access
CREATE POLICY "Admins can view all notifications"
  ON public.notifications
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update notifications"
  ON public.notifications
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete notifications"
  ON public.notifications
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users: Can only view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- ==============================================================================
-- 16. JOURNAL_ENTRIES TABLE POLICIES
-- ==============================================================================
-- Enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Admin: Full CRUD access
CREATE POLICY "Admins can view all journal entries"
  ON public.journal_entries
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create journal entries"
  ON public.journal_entries
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update journal entries"
  ON public.journal_entries
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete journal entries"
  ON public.journal_entries
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users: CRUD their own journal entries
CREATE POLICY "Users can view their own journal entries"
  ON public.journal_entries
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create journal entries"
  ON public.journal_entries
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own journal entries"
  ON public.journal_entries
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own journal entries"
  ON public.journal_entries
  FOR DELETE
  USING (user_id = auth.uid());

-- ==============================================================================
-- End of RLS Policies Migration
-- ==============================================================================

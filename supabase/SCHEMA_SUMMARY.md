# Mental Health Admin Panel - Database Schema Summary

## Overview
Complete Supabase PostgreSQL database schema migration for the Mental Health Admin Panel application. The schema is defined in `/supabase/migrations/001_initial_schema.sql` and is ready to be deployed to Supabase.

## Migration File Details
- **File**: `supabase/migrations/001_initial_schema.sql`
- **Lines**: 454
- **Tables Created**: 15
- **Enum Types**: 4
- **Indexes Created**: 51
- **Triggers Created**: 11

---

## Tables Created

### 1. **users** - Core user account table
- Stores information about all platform users (admin, expert, user roles)
- Linked to Supabase Auth via `id` (UUID)
- **Key Columns**: 
  - `id` (UUID, PK) - Links to auth.users
  - `email` (UNIQUE) - User email
  - `role` (ENUM: admin, expert, user) - User role
  - `streak_count`, `longest_streak` - Wellness tracking
  - `goals` (TEXT[]), `preferences` (JSONB) - User data
  - `last_login`, `created_at`, `updated_at` - Timestamps
- **Indexes**: email, role, created_at, last_login

### 2. **experts** - Expert/therapist profile table
- Extends users table with professional information
- Foreign Key: `id` → `users.id` (ON DELETE CASCADE)
- **Key Columns**:
  - `id` (UUID, PK, FK to users)
  - `is_approved` (BOOLEAN) - Admin approval status
  - `specialization` (VARCHAR) - e.g., "Anxiety", "Depression"
  - `hourly_rate`, `rating`, `total_reviews` - Pricing & ratings
  - `license_number`, `license_url` - Professional credentials
  - `certificate_urls` (TEXT[]) - Multiple certificates
  - `education`, `university`, `graduation_year` - Education info
  - `years_experience`, `title` - Professional details
- **Indexes**: is_approved, specialization, created_at

### 3. **expert_availability** - Expert scheduling table
- Defines weekly availability slots for experts
- Foreign Key: `expert_id` → `experts.id` (ON DELETE CASCADE)
- **Key Columns**:
  - `id` (UUID, PK)
  - `expert_id` (UUID, FK)
  - `day_of_week` (INTEGER: 0-6, where 0=Sunday)
  - `start_time`, `end_time` (TIME)
  - `created_at`, `updated_at`
- **Constraints**: day_of_week 0-6, start_time < end_time
- **Indexes**: expert_id, expert_id+day_of_week

### 4. **appointments** - User-Expert appointment bookings
- Tracks all appointments between users and experts
- Foreign Keys: `user_id` → users, `expert_id` → experts, `cancelled_by` → users
- **Key Columns**:
  - `id` (UUID, PK)
  - `user_id`, `expert_id` (FK)
  - `appointment_date` (TIMESTAMP)
  - `duration_minutes` (INTEGER > 0)
  - `call_type` (ENUM: chat, video, audio)
  - `status` (ENUM: pending, confirmed, cancelled, completed)
  - `payment_status` (VARCHAR) - unpaid, paid, refunded
  - `payment_id`, `payment_trans_id` - Payment references
  - `expert_base_price` (INTEGER)
  - `user_notes` (TEXT)
  - `cancelled_at`, `cancelled_by`, `cancelled_role`, `cancellation_reason` - Cancellation info
  - `refund_status` (VARCHAR)
- **Indexes**: user_id, expert_id, status, payment_status, appointment_date, created_at

### 5. **meditations** - Guided meditation content library
- Stores meditation audio and metadata
- **Key Columns**:
  - `id` (UUID, PK)
  - `title` (VARCHAR, NOT NULL)
  - `description` (TEXT)
  - `category` (VARCHAR) - e.g., "Sleep", "Anxiety", "Mindfulness"
  - `duration_minutes` (INTEGER > 0)
  - `audio_url` (TEXT, NOT NULL)
  - `thumbnail_url` (TEXT)
  - `level` (VARCHAR) - beginner, intermediate, advanced
  - `rating`, `total_reviews` (NUMERIC, INTEGER)
- **Indexes**: category, level, created_at

### 6. **mood_entries** - User mood tracking journal
- Records user mood entries with context
- Foreign Key: `user_id` → `users.id` (ON DELETE CASCADE)
- **Key Columns**:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK)
  - `mood_score` (INTEGER: 1-5)
  - `note` (TEXT) - User notes
  - `emotion_factors` (TEXT[]) - e.g., ["work", "family", "health"]
  - `tags` (TEXT[]) - Custom tags
  - `created_at`, `updated_at`
- **Constraints**: mood_score 1-5
- **Indexes**: user_id, created_at, user_id+created_at

### 7. **posts** - Community forum posts
- User-generated posts in community forum
- Foreign Key: `author_id` → `users.id` (ON DELETE CASCADE)
- **Key Columns**:
  - `id` (UUID, PK)
  - `author_id` (UUID, FK)
  - `title`, `content` (VARCHAR, TEXT - NOT NULL)
  - `image_url` (TEXT)
  - `category` (VARCHAR)
  - `is_anonymous` (BOOLEAN)
  - `likes_count`, `comment_count` (INTEGER ≥ 0)
- **Indexes**: author_id, category, created_at

### 8. **post_comments** - Comments on community posts
- Threaded comments on posts
- Foreign Keys: `post_id` → posts, `user_id` → users, `parent_comment_id` → self (nullable)
- **Key Columns**:
  - `id` (UUID, PK)
  - `post_id`, `user_id` (FK)
  - `content` (TEXT, NOT NULL)
  - `parent_comment_id` (UUID, nullable FK) - For nested comments
  - `is_anonymous` (BOOLEAN)
  - `created_at`, `updated_at`
- **Indexes**: post_id, user_id, parent_comment_id, created_at

### 9. **post_likes** - Likes on community posts
- Many-to-many relationship: users can like posts
- Composite Unique: (post_id, user_id)
- **Key Columns**:
  - `id` (UUID, PK)
  - `post_id`, `user_id` (FK)
  - `created_at`
- **Constraint**: UNIQUE(post_id, user_id) - One like per user per post
- **Indexes**: post_id, user_id

### 10. **chat_rooms** - Chat session containers
- Groups messages between users/experts
- Foreign Key: `appointment_id` → `appointments.id` (nullable, ON DELETE CASCADE)
- **Key Columns**:
  - `id` (UUID, PK)
  - `appointment_id` (UUID, FK, nullable)
  - `status` (VARCHAR) - active, archived, etc.
  - `last_message` (TEXT)
  - `last_message_time` (TIMESTAMP)
  - `created_at`, `updated_at`
- **Indexes**: appointment_id, status, created_at

### 11. **messages** - Chat messages
- Individual messages within chat rooms
- Foreign Keys: `room_id` → chat_rooms, `sender_id` → users
- **Key Columns**:
  - `id` (UUID, PK)
  - `room_id` (UUID, FK)
  - `sender_id` (UUID, FK)
  - `content` (TEXT, NOT NULL)
  - `type` (VARCHAR) - text, image, file, etc.
  - `is_pinned` (BOOLEAN)
  - `created_at`, `updated_at`
- **Indexes**: room_id, sender_id, created_at, room_id+created_at

### 12. **chat_participants** - Chat room membership
- Maps users to chat rooms they're part of
- Composite Primary Key: (room_id, user_id)
- **Key Columns**:
  - `room_id` (UUID, FK)
  - `user_id` (UUID, FK)
  - `created_at`
- **Indexes**: user_id, room_id+user_id

### 13. **ai_conversations** - AI chat sessions
- Parent table for AI conversation threads
- Foreign Key: `user_id` → `users.id` (ON DELETE CASCADE)
- **Key Columns**:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK)
  - `title` (VARCHAR)
  - `last_message_preview` (TEXT)
  - `is_archived` (BOOLEAN)
  - `created_at`, `updated_at`
- **Indexes**: user_id, created_at, is_archived

### 14. **ai_messages** - AI conversation messages
- Messages within AI conversations
- Foreign Keys: `conversation_id` → ai_conversations, `user_id` → users
- **Key Columns**:
  - `id` (UUID, PK)
  - `conversation_id` (UUID, FK)
  - `user_id` (UUID, FK)
  - `role` (ENUM: user, assistant, system)
  - `content` (TEXT, NOT NULL)
  - `model_name` (VARCHAR) - e.g., "gpt-4"
  - `metadata` (JSONB) - Flexible metadata storage
  - `prompt_tokens`, `completion_tokens`, `total_tokens` (INTEGER)
  - `latency_ms` (INTEGER)
  - `created_at`
- **Constraints**: All token counts ≥ 0, latency_ms ≥ 0
- **Indexes**: conversation_id, user_id, role, created_at, conversation_id+created_at

### 15. **notifications** - User notifications
- System notifications for users
- Foreign Key: `user_id` → `users.id` (ON DELETE CASCADE)
- **Key Columns**:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK)
  - `title` (TEXT, NOT NULL)
  - `message` (TEXT, NOT NULL)
  - `type` (VARCHAR) - appointment, message, system, etc.
  - `is_read` (BOOLEAN)
  - `metadata` (JSONB) - Additional context
  - `created_at`
- **Indexes**: user_id, is_read, created_at, user_id+is_read

---

## Enum Types

1. **user_role**: `'admin'`, `'expert'`, `'user'`
2. **appointment_call_type**: `'chat'`, `'video'`, `'audio'`
3. **appointment_status**: `'pending'`, `'confirmed'`, `'cancelled'`, `'completed'`
4. **ai_message_role**: `'user'`, `'assistant'`, `'system'`

---

## Key Features

### ✅ Data Integrity
- **Foreign Key Constraints**: All relationships properly constrained with `ON DELETE CASCADE`
- **CHECK Constraints**: Ensure valid data (e.g., ratings 0-5, mood_score 1-5, streak_count ≥ 0)
- **UNIQUE Constraints**: Email uniqueness in users, one like per post per user

### ✅ Performance Optimization
- **51 Indexes** strategically placed on:
  - Foreign keys (user_id, expert_id, post_id, etc.)
  - Status/state fields (status, is_read, is_approved)
  - Timestamps (created_at DESC for recent data)
  - Composite indexes for common query patterns

### ✅ Automatic Timestamps
- **Triggers**: 11 triggers automatically update `updated_at` columns on any row modification
- Function: `update_updated_at_column()` - Prevents manual timestamp management errors

### ✅ Data Types
- **UUIDs**: All primary keys use PostgreSQL's native `gen_random_uuid()`
- **Timestamps**: All timestamps are `TIMESTAMP WITH TIME ZONE` for timezone awareness
- **Arrays**: TEXT[] for goals, emotion_factors, tags, certificate_urls
- **JSONB**: For flexible metadata storage (preferences, metadata)
- **Enums**: Type-safe constrained values instead of strings

### ⚠️ NOT INCLUDED (Handle Separately)
- **Row Level Security (RLS)**: Policies not enabled in this migration
  - Enable RLS policies separately per security requirements
  - Admin policies for full access
  - Expert policies for own data only
  - User policies for their own content
- **Audit Logging**: Not included (can be added with separate migration)
- **Full-Text Search**: Indexes not created (add if needed)

---

## How to Apply Migration

### Option 1: Via Supabase Dashboard
1. Go to SQL Editor in Supabase Dashboard
2. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Paste into new query
4. Click "Run"

### Option 2: Via Supabase CLI
```bash
# Install/update CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase migration up
```

### Option 3: Manual SQL Import
- Log into PostgreSQL directly
- Run the SQL file contents

---

## Verification Checklist

After applying migration, verify:

- [ ] All 15 tables created successfully
- [ ] All 4 enum types available
- [ ] All 51 indexes created
- [ ] All 11 triggers functional
- [ ] Foreign keys working (cascade deletes)
- [ ] Timestamps auto-populating and auto-updating
- [ ] Check constraints enforced
- [ ] Unique constraints enforced

### Quick Verification Query
```sql
-- Count tables
SELECT count(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
-- Should return: 15

-- List all tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Count indexes
SELECT count(*) FROM pg_indexes 
WHERE schemaname = 'public';
-- Should return: 51

-- List triggers
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
ORDER BY trigger_name;
-- Should return: 11
```

---

## Notes

### Future Enhancements
1. **RLS Policies**: Add security policies for data access control
2. **Audit Table**: Create audit logging for compliance
3. **Full-Text Search**: Add GIN indexes for content search
4. **Replication**: Setup read replicas for scaling
5. **Archiving**: Add historical data archiving policies

### Performance Considerations
- Indexes optimized for common queries (user lookups, status filters, date ranges)
- `created_at DESC` indexes for reverse chronological queries (most recent first)
- Composite indexes for multi-column WHERE clauses
- Consider partitioning large tables (appointments, mood_entries) by date if needed

### Security Reminders
- ⚠️ No RLS enabled in this migration - add security policies before production
- ⚠️ Ensure Supabase Auth is properly configured
- ⚠️ API policies should restrict unauthorized access
- ⚠️ Audit sensitive operations (expert approval, payment records)

---

## File Location
`/Users/nicotine/Documents/mental-health-admin-panel/supabase/migrations/001_initial_schema.sql`

Created: 2024

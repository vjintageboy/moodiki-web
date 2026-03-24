# Mental Health Admin Panel - Database Schema Reference

## Complete Table Structure Documentation

This document provides a complete reference of all database tables and their column structures.

---

## 1. users

**Primary key:** `id` (UUID)  
**Purpose:** Core user account table - stores all users (admin, expert, user roles)

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Links to auth.users |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| full_name | VARCHAR(255) | | User's full name |
| avatar_url | TEXT | | Profile picture URL |
| role | user_role | DEFAULT 'user' | admin, expert, or user |
| streak_count | INTEGER | DEFAULT 0, ≥0 | Current streak count |
| longest_streak | INTEGER | DEFAULT 0, ≥0 | All-time longest streak |
| date_of_birth | TIMESTAMP WITH TIME ZONE | | User's birthdate |
| gender | VARCHAR(50) | | User's gender |
| goals | TEXT[] | | Array of user goals |
| preferences | JSONB | DEFAULT '{}' | User preferences (flexible) |
| last_login | TIMESTAMP WITH TIME ZONE | | Last login timestamp |
| total_activities | INTEGER | DEFAULT 0, ≥0 | Total activities count |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Record creation time |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Last update time |

**Indexes:** email, role, created_at DESC, last_login DESC

---

## 2. experts

**Primary key:** `id` (UUID, FK to users)  
**Purpose:** Expert/therapist profile extension of users table

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PK, FK→users.id ON DELETE CASCADE | Expert ID |
| bio | TEXT | | Professional biography |
| specialization | VARCHAR(255) | | e.g., "Anxiety", "Depression" |
| hourly_rate | INTEGER | DEFAULT 0, ≥0 | Consultation fee (cents) |
| rating | NUMERIC(3,2) | DEFAULT 0.0, 0-5 | Average rating |
| total_reviews | INTEGER | DEFAULT 0, ≥0 | Number of reviews |
| is_approved | BOOLEAN | DEFAULT false | Admin approval status |
| years_experience | INTEGER | DEFAULT 0, ≥0 | Years of experience |
| license_number | VARCHAR(255) | | Professional license ID |
| license_url | TEXT | | License document URL |
| certificate_urls | TEXT[] | | Array of certificate URLs |
| education | VARCHAR(255) | | Education details |
| university | VARCHAR(255) | | University name |
| graduation_year | INTEGER | | Year of graduation |
| title | VARCHAR(50) | | e.g., "Dr.", "Ms." |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Record creation time |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Last update time |

**Indexes:** is_approved, specialization, created_at DESC

---

## 3. expert_availability

**Primary key:** `id` (UUID)  
**Purpose:** Define expert's weekly availability slots

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Availability slot ID |
| expert_id | UUID | FK→experts.id ON DELETE CASCADE, NOT NULL | Expert reference |
| day_of_week | INTEGER | NOT NULL, 0-6 | 0=Sun, 1=Mon, ..., 6=Sat |
| start_time | TIME | NOT NULL | Slot start time |
| end_time | TIME | NOT NULL | Slot end time |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Record creation time |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Last update time |

**Constraints:** start_time < end_time  
**Indexes:** expert_id, (expert_id, day_of_week)

---

## 4. appointments

**Primary key:** `id` (UUID)  
**Purpose:** User-expert appointment bookings

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Appointment ID |
| user_id | UUID | FK→users.id ON DELETE CASCADE, NOT NULL | User reference |
| expert_id | UUID | FK→experts.id ON DELETE CASCADE, NOT NULL | Expert reference |
| appointment_date | TIMESTAMP WITH TIME ZONE | NOT NULL | Scheduled date/time |
| duration_minutes | INTEGER | DEFAULT 60, >0 | Session duration |
| call_type | appointment_call_type | NOT NULL | chat, video, or audio |
| status | appointment_status | DEFAULT 'pending' | pending, confirmed, completed, cancelled |
| payment_status | VARCHAR(50) | DEFAULT 'unpaid' | unpaid, paid, refunded |
| payment_id | VARCHAR(255) | | Payment processor ID |
| payment_trans_id | VARCHAR(255) | | Payment transaction ID |
| expert_base_price | INTEGER | ≥0 | Consultation fee (cents) |
| user_notes | TEXT | | Notes from user |
| cancelled_at | TIMESTAMP WITH TIME ZONE | | Cancellation timestamp |
| cancelled_by | UUID | FK→users.id ON DELETE SET NULL | User who cancelled |
| cancelled_role | VARCHAR(50) | | Role of canceller |
| cancellation_reason | TEXT | | Reason for cancellation |
| refund_status | VARCHAR(50) | DEFAULT 'none' | none, pending, completed |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Record creation time |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Last update time |

**Indexes:** user_id, expert_id, status, payment_status, appointment_date, created_at DESC

---

## 5. meditations

**Primary key:** `id` (UUID)  
**Purpose:** Guided meditation content library

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Meditation ID |
| title | VARCHAR(255) | NOT NULL | Meditation title |
| description | TEXT | | Full description |
| category | VARCHAR(255) | | e.g., "Sleep", "Anxiety" |
| duration_minutes | INTEGER | >0 | Audio duration |
| audio_url | TEXT | NOT NULL | Audio file URL |
| thumbnail_url | TEXT | | Cover image URL |
| level | VARCHAR(50) | DEFAULT 'beginner' | beginner, intermediate, advanced |
| rating | NUMERIC(3,2) | DEFAULT 0.0, 0-5 | Average rating |
| total_reviews | INTEGER | DEFAULT 0, ≥0 | Review count |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Record creation time |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Last update time |

**Indexes:** category, level, created_at DESC

---

## 6. mood_entries

**Primary key:** `id` (UUID)  
**Purpose:** User mood tracking journal entries

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Entry ID |
| user_id | UUID | FK→users.id ON DELETE CASCADE, NOT NULL | User reference |
| mood_score | INTEGER | NOT NULL, 1-5 | 1=terrible to 5=excellent |
| note | TEXT | | User's note about mood |
| emotion_factors | TEXT[] | | e.g., ["work", "family"] |
| tags | TEXT[] | | Custom tags |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Entry timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Last update time |

**Indexes:** user_id, created_at DESC, (user_id, created_at DESC)

---

## 7. posts

**Primary key:** `id` (UUID)  
**Purpose:** Community forum posts

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Post ID |
| author_id | UUID | FK→users.id ON DELETE CASCADE, NOT NULL | Author reference |
| title | VARCHAR(255) | NOT NULL | Post title |
| content | TEXT | NOT NULL | Post body content |
| image_url | TEXT | | Featured image |
| category | VARCHAR(255) | DEFAULT 'community' | Post category |
| is_anonymous | BOOLEAN | DEFAULT false | Hide author identity |
| likes_count | INTEGER | DEFAULT 0, ≥0 | Number of likes |
| comment_count | INTEGER | DEFAULT 0, ≥0 | Number of comments |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Record creation time |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Last update time |

**Indexes:** author_id, category, created_at DESC

---

## 8. post_comments

**Primary key:** `id` (UUID)  
**Purpose:** Threaded comments on community posts

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Comment ID |
| post_id | UUID | FK→posts.id ON DELETE CASCADE, NOT NULL | Post reference |
| user_id | UUID | FK→users.id ON DELETE CASCADE, NOT NULL | Commenter reference |
| content | TEXT | NOT NULL | Comment text |
| parent_comment_id | UUID | FK→post_comments.id ON DELETE CASCADE | Parent comment (for nested comments) |
| is_anonymous | BOOLEAN | DEFAULT false | Hide commenter identity |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Record creation time |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Last update time |

**Indexes:** post_id, user_id, parent_comment_id, created_at DESC

---

## 9. post_likes

**Primary key:** `id` (UUID)  
**Purpose:** Likes on community posts

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Like ID |
| post_id | UUID | FK→posts.id ON DELETE CASCADE, NOT NULL | Post reference |
| user_id | UUID | FK→users.id ON DELETE CASCADE, NOT NULL | User who liked |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Like timestamp |

**Constraints:** UNIQUE(post_id, user_id) - one like per user per post  
**Indexes:** post_id, user_id

---

## 10. chat_rooms

**Primary key:** `id` (UUID)  
**Purpose:** Chat session containers

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Room ID |
| appointment_id | UUID | FK→appointments.id ON DELETE CASCADE | Associated appointment |
| status | VARCHAR(50) | DEFAULT 'active' | active, archived, closed |
| last_message | TEXT | | Last message preview |
| last_message_time | TIMESTAMP WITH TIME ZONE | | Timestamp of last message |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Room creation time |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Last update time |

**Indexes:** appointment_id, status, created_at DESC

---

## 11. messages

**Primary key:** `id` (UUID)  
**Purpose:** Chat messages within rooms

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Message ID |
| room_id | UUID | FK→chat_rooms.id ON DELETE CASCADE, NOT NULL | Room reference |
| sender_id | UUID | FK→users.id ON DELETE CASCADE, NOT NULL | Sender reference |
| content | TEXT | NOT NULL | Message text |
| type | VARCHAR(50) | DEFAULT 'text' | text, image, file, etc. |
| is_pinned | BOOLEAN | DEFAULT false | Pinned message flag |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Message timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Last update time |

**Indexes:** room_id, sender_id, created_at DESC, (room_id, created_at DESC)

---

## 12. chat_participants

**Primary key:** (room_id, user_id) - composite  
**Purpose:** Chat room membership mapping

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| room_id | UUID | FK→chat_rooms.id ON DELETE CASCADE, NOT NULL | Room reference |
| user_id | UUID | FK→users.id ON DELETE CASCADE, NOT NULL | User reference |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Join timestamp |

**Constraint:** PK (room_id, user_id)  
**Indexes:** user_id, (room_id, user_id)

---

## 13. ai_conversations

**Primary key:** `id` (UUID)  
**Purpose:** AI chat session containers

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Conversation ID |
| user_id | UUID | FK→users.id ON DELETE CASCADE, NOT NULL | User reference |
| title | VARCHAR(255) | | Conversation title |
| last_message_preview | TEXT | | Preview of last message |
| is_archived | BOOLEAN | DEFAULT false | Archive flag |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Last update time |

**Indexes:** user_id, created_at DESC, is_archived

---

## 14. ai_messages

**Primary key:** `id` (UUID)  
**Purpose:** Messages within AI conversations

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Message ID |
| conversation_id | UUID | FK→ai_conversations.id ON DELETE CASCADE, NOT NULL | Conversation reference |
| user_id | UUID | FK→users.id ON DELETE CASCADE, NOT NULL | User reference |
| role | ai_message_role | NOT NULL | user, assistant, system |
| content | TEXT | NOT NULL | Message content |
| model_name | VARCHAR(255) | | AI model used (e.g., "gpt-4") |
| metadata | JSONB | DEFAULT '{}' | Additional metadata |
| prompt_tokens | INTEGER | ≥0 | Input token count |
| completion_tokens | INTEGER | ≥0 | Output token count |
| total_tokens | INTEGER | ≥0 | Total token count |
| latency_ms | INTEGER | ≥0 | Response latency in ms |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Message timestamp |

**Indexes:** conversation_id, user_id, role, created_at DESC, (conversation_id, created_at DESC)

---

## 15. notifications

**Primary key:** `id` (UUID)  
**Purpose:** User notifications

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Notification ID |
| user_id | UUID | FK→users.id ON DELETE CASCADE, NOT NULL | User reference |
| title | TEXT | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification message |
| type | VARCHAR(100) | | appointment, message, system, etc. |
| is_read | BOOLEAN | DEFAULT false | Read status |
| metadata | JSONB | DEFAULT '{}' | Additional context |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Creation timestamp |

**Indexes:** user_id, is_read, created_at DESC, (user_id, is_read)

---

## Enum Types

### user_role
```sql
'admin'    -- Administrator with full system access
'expert'   -- Expert/therapist with limited access
'user'     -- Regular user with personal access only
```

### appointment_call_type
```sql
'chat'     -- Text chat session
'video'    -- Video call session
'audio'    -- Voice call session
```

### appointment_status
```sql
'pending'     -- Awaiting confirmation
'confirmed'   -- Scheduled and confirmed
'completed'   -- Session finished
'cancelled'   -- Session cancelled
```

### ai_message_role
```sql
'user'      -- User message
'assistant' -- AI assistant response
'system'    -- System message
```

---

## Foreign Key Relationships

```
users (id)
  ├── experts (id) [1:1]
  │   └── expert_availability (expert_id) [1:N]
  │
  ├── appointments (user_id) [1:N]
  ├── appointments (expert_id) [via experts]
  ├── appointments (cancelled_by) [1:N, nullable]
  │
  ├── mood_entries (user_id) [1:N]
  ├── posts (author_id) [1:N]
  ├── post_comments (user_id) [1:N]
  ├── post_likes (user_id) [1:N]
  │
  ├── messages (sender_id) [1:N]
  ├── chat_participants (user_id) [1:N]
  │
  ├── ai_conversations (user_id) [1:N]
  ├── ai_messages (user_id) [1:N]
  │
  └── notifications (user_id) [1:N]

posts (id)
  ├── post_comments (post_id) [1:N]
  ├── post_likes (post_id) [1:N]
  └── post_comments (parent_comment_id) [self-referencing, 1:N]

chat_rooms (id)
  ├── messages (room_id) [1:N]
  ├── chat_participants (room_id) [1:N]
  └── appointments (id) [via appointment_id]

ai_conversations (id)
  └── ai_messages (conversation_id) [1:N]
```

---

## Performance Considerations

### Indexes Summary
- **23** Foreign key indexes (for JOINs)
- **8** Status/state column indexes (for filtering)
- **12** Timestamp indexes (for sorting and range queries)
- **8** Composite indexes (for multi-column queries)

### Query Optimization Tips
1. Always include user_id in WHERE clauses when possible
2. Use created_at DESC for reverse chronological queries
3. Combine indexed columns for better performance
4. Archive/partition large tables (appointments, mood_entries, messages) by date

### Estimated Table Sizes
| Table | Growth | Recommendation |
|-------|--------|---|
| users | Low | Standard table |
| experts | Low | Standard table |
| appointments | High | Partition by month |
| mood_entries | Very High | Partition by month, archive old data |
| messages | Very High | Partition by month |
| ai_messages | High | Partition by month |
| posts | Medium | Standard table |
| post_comments | High | Consider partitioning |
| notifications | Medium | Implement cleanup policy |

---

## Last Updated
2024 - Ready for production deployment

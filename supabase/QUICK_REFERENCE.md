# Database Schema - Quick Reference

## Table Relationships Diagram

```
auth.users (Supabase Auth)
    ↓
public.users (main user table)
    ├── 1-to-1 → experts (extends users)
    │            ├── 1-to-many → expert_availability
    │            └── 1-to-many ← appointments (expert_id)
    │
    ├── 1-to-many → appointments (user_id)
    │
    ├── 1-to-many → mood_entries
    │
    ├── 1-to-many → posts (author_id)
    │                ├── 1-to-many → post_comments
    │                └── 1-to-many → post_likes
    │
    ├── 1-to-many → post_comments (user_id)
    │
    ├── 1-to-many → post_likes (user_id)
    │
    ├── 1-to-many → ai_conversations
    │                └── 1-to-many → ai_messages
    │
    ├── 1-to-many → ai_messages (user_id)
    │
    ├── 1-to-many → notifications
    │
    ├── 1-to-many → chat_participants
    │                └── N-to-M ← chat_rooms
    │
    ├── 1-to-many → messages (sender_id)
    │
    └── 1-to-many ← appointments (cancelled_by, nullable)

appointments
    ├── many-to-1 → users (user_id)
    ├── many-to-1 → experts (expert_id)
    ├── many-to-1 → users (cancelled_by, nullable)
    └── 1-to-many → chat_rooms (appointment_id, nullable)
```

## Essential Queries

### Get user with expert info
```sql
SELECT u.*, e.* 
FROM users u
LEFT JOIN experts e ON u.id = e.id
WHERE u.id = $1;
```

### Get upcoming appointments for expert
```sql
SELECT a.*, u.full_name, u.avatar_url
FROM appointments a
JOIN users u ON a.user_id = u.id
WHERE a.expert_id = $1
  AND a.appointment_date >= now()
  AND a.status IN ('pending', 'confirmed')
ORDER BY a.appointment_date ASC;
```

### Get expert availability
```sql
SELECT * FROM expert_availability
WHERE expert_id = $1
ORDER BY day_of_week ASC, start_time ASC;
```

### Get user mood trend (last 30 days)
```sql
SELECT DATE(created_at) as date, AVG(mood_score) as avg_mood
FROM mood_entries
WHERE user_id = $1
  AND created_at > now() - interval '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Get community posts with stats
```sql
SELECT 
  p.*,
  u.full_name,
  u.avatar_url,
  COUNT(DISTINCT pl.id) as like_count,
  COUNT(DISTINCT pc.id) as comment_count
FROM posts p
JOIN users u ON p.author_id = u.id
LEFT JOIN post_likes pl ON p.id = pl.post_id
LEFT JOIN post_comments pc ON p.id = pc.post_id
GROUP BY p.id, u.id, u.full_name, u.avatar_url
ORDER BY p.created_at DESC
LIMIT 20;
```

### Get pending expert approvals
```sql
SELECT u.*, e.*
FROM experts e
JOIN users u ON e.id = u.id
WHERE e.is_approved = false
ORDER BY e.created_at DESC;
```

### Get chat history
```sql
SELECT m.*,
  sender.full_name as sender_name,
  sender.avatar_url as sender_avatar
FROM messages m
JOIN users sender ON m.sender_id = sender.id
WHERE m.room_id = $1
ORDER BY m.created_at DESC
LIMIT 50;
```

### Get unread notifications
```sql
SELECT * FROM notifications
WHERE user_id = $1
  AND is_read = false
ORDER BY created_at DESC;
```

### Get AI conversation history
```sql
SELECT * FROM ai_messages
WHERE conversation_id = $1
ORDER BY created_at ASC;
```

## Enum Values

| Type | Values |
|------|--------|
| `user_role` | `'admin'`, `'expert'`, `'user'` |
| `appointment_call_type` | `'chat'`, `'video'`, `'audio'` |
| `appointment_status` | `'pending'`, `'confirmed'`, `'cancelled'`, `'completed'` |
| `ai_message_role` | `'user'`, `'assistant'`, `'system'` |

## Common Constraints

| Table | Field | Constraint |
|-------|-------|-----------|
| users | streak_count, longest_streak, total_activities | ≥ 0 |
| experts | hourly_rate, total_reviews, years_experience | ≥ 0 |
| experts | rating | 0 to 5 |
| expert_availability | day_of_week | 0 to 6 (Sun-Sat) |
| expert_availability | start_time < end_time | Time validation |
| appointments | duration_minutes | > 0 |
| mood_entries | mood_score | 1 to 5 |
| post_likes | (post_id, user_id) | Unique per user |
| meditations | rating, duration | 0-5 (rating), > 0 (duration) |
| ai_messages | tokens, latency | ≥ 0 |

## Automatic Fields

These fields are automatically managed:
- `id` (all tables) - Auto-generated UUID
- `created_at` (all tables) - Set to current timestamp on insert
- `updated_at` (most tables) - Auto-updated on any row modification

## Table Sizes (Planning)

| Table | Estimated Growth | Suggested Partitioning |
|-------|------------------|----------------------|
| appointments | High | By month (appointment_date) |
| mood_entries | Very High | By month (created_at) |
| messages | Very High | By month (created_at) |
| ai_messages | High | By month (created_at) |
| notifications | Medium-High | By month (created_at) |
| posts | Medium | By quarter (created_at) |
| post_comments | High | By quarter (created_at) |

## RLS Policy Recommendations

(To be implemented separately)

```sql
-- Admin: Full access to all tables
CREATE POLICY admin_all ON public.users 
  AS PERMISSIVE FOR ALL 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Expert: Access to own data
CREATE POLICY expert_own ON public.appointments
  FOR SELECT
  USING (expert_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- User: Access to own content
CREATE POLICY user_own ON public.posts
  FOR ALL
  USING (author_id = auth.uid() OR
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
```

## Performance Tips

1. **Always filter by user_id when querying** - leverages index
2. **Use created_at DESC indexes** - for reverse chronological queries
3. **Batch operations** - group inserts/updates when possible
4. **Archive old data** - move completed appointments and old mood entries
5. **Monitor notification table size** - clean up old read notifications
6. **Use prepared statements** - prevents SQL injection and aids query planning

## Common Issues & Solutions

### Issue: Slow expert searches
**Solution**: Add full-text search index on `bio` and `specialization`

### Issue: Chat messages loading slowly
**Solution**: Implement message pagination with cursor-based queries

### Issue: Large mood_entries table
**Solution**: Archive entries older than 2 years, partition by month

### Issue: Notification spam
**Solution**: Implement notification grouping or cleanup policies

---

*For detailed schema information, see SCHEMA_SUMMARY.md*

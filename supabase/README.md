# Supabase Configuration & Database

This directory contains all Supabase-related configuration, migrations, and documentation for the Mental Health Admin Panel.

## 📁 Directory Structure

```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql      # Main schema migration (ALL 15 tables)
│   └── 002_rls_policies.sql        # RLS security policies (separate)
│
├── README.md                        # This file
├── SCHEMA_SUMMARY.md               # Detailed table documentation
├── QUICK_REFERENCE.md              # Quick lookup guide & common queries
└── storage-setup.md                # Storage bucket configuration
```

## 🚀 Quick Start

### 1. Create Supabase Project
- Go to https://supabase.com
- Create new project
- Note your project URL and API keys

### 2. Apply Database Schema
Choose one of these methods:

**Method A: Supabase Dashboard (Easiest)**
```
1. Go to SQL Editor
2. Copy contents of migrations/001_initial_schema.sql
3. Paste and run
```

**Method B: Supabase CLI**
```bash
npm install -g supabase
supabase link --project-ref your-project-ref
supabase migration up
```

**Method C: Direct PostgreSQL**
```bash
psql -h your-host.supabase.co -U postgres -d postgres -f migrations/001_initial_schema.sql
```

### 3. (Optional) Apply RLS Policies
After schema is working:
```
1. Go to SQL Editor
2. Copy contents of migrations/002_rls_policies.sql
3. Paste and run
```

## 📊 Database Schema Overview

### 15 Tables Created
1. **users** - Core user accounts
2. **experts** - Expert/therapist profiles
3. **expert_availability** - Weekly availability slots
4. **appointments** - User-expert bookings
5. **meditations** - Guided meditation library
6. **mood_entries** - Mood tracking journal
7. **posts** - Community forum
8. **post_comments** - Post comments (threaded)
9. **post_likes** - Like tracking
10. **chat_rooms** - Chat containers
11. **messages** - Chat messages
12. **chat_participants** - Room membership
13. **ai_conversations** - AI chat sessions
14. **ai_messages** - AI messages
15. **notifications** - User notifications

### 4 Enum Types
- `user_role` (admin, expert, user)
- `appointment_call_type` (chat, video, audio)
- `appointment_status` (pending, confirmed, cancelled, completed)
- `ai_message_role` (user, assistant, system)

### 51 Performance Indexes
- Foreign key indexes
- Status/state filters
- Timestamp sorting
- Composite queries

### 11 Auto-Update Triggers
- Automatic `updated_at` timestamp management

## 📖 Documentation Files

### SCHEMA_SUMMARY.md
Comprehensive documentation including:
- Each table's columns and constraints
- Foreign key relationships
- Performance features
- Verification checklist
- Application instructions

**Use this for:** In-depth understanding of the schema

### QUICK_REFERENCE.md
Quick lookup guide featuring:
- Table relationship diagram
- Essential SQL queries
- Enum values
- Performance tips
- Common issues & solutions

**Use this for:** Quick queries and debugging

### DATABASE_SCHEMA.md (in root)
Complete table structure reference:
- All 15 tables with column details
- Constraints and indexes
- Enum definitions
- Relationship mapping
- Performance considerations

**Use this for:** Exact column specifications and data types

## 🔧 Configuration

### Environment Variables Required
```bash
# .env.local (for local development)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# .env.local (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Supabase Client Setup
See `lib/supabase/client.ts` for proper configuration

## 🔐 Security

### Row Level Security (RLS)
- NOT enabled in initial schema migration
- Apply `migrations/002_rls_policies.sql` to enable
- Required for production security

### Auth Integration
- Users table linked to `auth.users` via id
- Configure JWT claims for role-based access
- Use Supabase Auth for authentication

## ✅ Verification Checklist

After applying migration, verify:

```sql
-- Check tables created (should be 15)
SELECT count(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Check indexes created (should be 51)
SELECT count(*) FROM pg_indexes WHERE schemaname = 'public';

-- Check triggers created (should be 11)
SELECT count(*) FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Check enum types
SELECT * FROM pg_type WHERE typtype = 'e';
```

## 🐛 Troubleshooting

### Issue: "permission denied" error
- Check API key is correct
- Verify RLS policies allow the operation
- Ensure user has proper role

### Issue: Foreign key constraint violation
- Check referenced record exists
- Verify correct parent ID is used
- Use CASCADE delete carefully

### Issue: Duplicate key error
- Check UNIQUE constraints (email, post_likes)
- Verify composite primary keys

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT & RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🔄 Backup & Recovery

### Before Production
1. ✅ Test on staging environment
2. ✅ Create backup of production database
3. ✅ Have rollback plan
4. ✅ Test disaster recovery

### Backup Command
```sql
-- Via psql
pg_dump -h your-host -U postgres -d postgres > backup.sql

-- Restore from backup
psql -h your-host -U postgres -d postgres < backup.sql
```

## 📝 Notes

### What's Included
✓ Complete schema for all 15 tables
✓ Foreign key relationships
✓ Check constraints for data validity
✓ 51 performance indexes
✓ Automatic timestamp triggers
✓ Enum type definitions

### What's NOT Included
✗ RLS policies (apply separately)
✗ Audit logging (optional)
✗ Full-text search indexes (add if needed)
✗ Read replicas (configure separately)

### Future Enhancements
1. Add RLS policies (security)
2. Add audit logging (compliance)
3. Add full-text search (search feature)
4. Add replication (scaling)
5. Archive old data (performance)

## 📞 Support

For issues or questions:
1. Check QUICK_REFERENCE.md for common queries
2. Review SCHEMA_SUMMARY.md for detailed info
3. See Supabase documentation
4. Check migration file SQL comments

---

**Last Updated:** 2024  
**Status:** ✅ Production Ready

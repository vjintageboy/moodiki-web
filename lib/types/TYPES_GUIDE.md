# TypeScript Database Types Guide

This guide explains how to use the types defined in `database.types.ts` for the Mental Health Admin Panel.

## 📋 File Structure

```
lib/types/
├── database.types.ts     # All database types and enums
└── TYPES_GUIDE.md        # This file
```

---

## 🎯 Quick Reference

### Enums
Use these enums for type-safe enum values:

```typescript
import { UserRole, AppointmentStatus, CallType, MeditationLevel, MessageRole, PaymentStatus, RefundStatus } from '@/lib/types/database.types';

// Using enums
const role = UserRole.Admin;
const status = AppointmentStatus.Pending;
const callType = CallType.Video;

// Or use the string type unions
import type { UserRoleType, AppointmentStatusType, CallTypeType } from '@/lib/types/database.types';

const userRole: UserRoleType = 'admin';
const appointmentStatus: AppointmentStatusType = 'pending';
```

### Table Types
Use these for database records:

```typescript
import type { User, Expert, Appointment, Meditation } from '@/lib/types/database.types';

// Type a user object
const user: User = {
  id: '123',
  email: 'user@example.com',
  full_name: 'John Doe',
  role: 'user',
  // ... other fields
};

// Type an expert
const expert: Expert = {
  id: '456',
  specialization: 'Anxiety',
  is_approved: true,
  // ... other fields
};
```

---

## 📝 Usage Patterns

### 1. Inserting Records

Use the `Insert` types to ensure you don't include auto-generated fields:

```typescript
import type { UserInsert, AppointmentInsert } from '@/lib/types/database.types';

// Creating a new user - TypeScript will error if you try to set id/created_at/updated_at
const newUser: UserInsert = {
  email: 'newuser@example.com',
  full_name: 'Jane Doe',
  role: 'user',
  streak_count: 0,
  longest_streak: 0,
  total_activities: 0,
  // ... other fields (id, created_at, updated_at are forbidden)
};

const newAppointment: AppointmentInsert = {
  user_id: 'user-123',
  expert_id: 'expert-456',
  appointment_date: new Date().toISOString(),
  duration_minutes: 60,
  call_type: 'video',
  status: 'pending',
  payment_status: 'unpaid',
  refund_status: 'none',
  // ... other fields
};
```

### 2. Updating Records

Use the `Update` types which make all fields optional but require the id:

```typescript
import type { UserUpdate, MeditationUpdate } from '@/lib/types/database.types';

// Updating a user - only changed fields are required
const updateUser: UserUpdate = {
  id: 'user-123',
  avatar_url: 'https://example.com/avatar.jpg', // Only change what you need
  last_login: new Date().toISOString(),
};

// Updating meditation
const updateMeditation: MeditationUpdate = {
  id: 'meditation-456',
  rating: 4.5,
  total_reviews: 105,
};
```

### 3. Working with Joined Data

Use the relationship types for queries that return related data:

```typescript
import type { ExpertWithUser, AppointmentWithDetails, PostWithAuthor } from '@/lib/types/database.types';

// Expert with their user profile
const expertData: ExpertWithUser = {
  id: 'expert-123',
  bio: 'Licensed therapist',
  is_approved: true,
  user: {
    id: 'expert-123',
    email: 'expert@example.com',
    full_name: 'Dr. Smith',
    // ... other user fields
  },
};

// Appointment with user and expert details
const appointmentData: AppointmentWithDetails = {
  id: 'appointment-789',
  user_id: 'user-123',
  expert_id: 'expert-456',
  status: 'confirmed',
  user: { /* user data */ },
  expert: { /* expert data */ },
  expertUser: { /* expert's user data */ },
};

// Post with author info
const post: PostWithAuthor = {
  id: 'post-123',
  title: 'My Journey',
  content: 'Lorem ipsum...',
  author: {
    id: 'author-123',
    full_name: 'John Doe',
    // ... other user fields
  },
};
```

---

## 🔍 Advanced Usage

### 1. Generic Database Operations

The `Tables` and `TablesInsert`/`TablesUpdate` types enable generic operations:

```typescript
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database.types';

// Generic function to fetch any table
async function fetchTable<T extends keyof Tables>(tableName: T): Promise<Tables[T][]> {
  const { data } = await supabase
    .from(tableName)
    .select('*');
  return data as Tables[T][];
}

// Generic function to insert
async function insertRecord<T extends keyof TablesInsert>(
  tableName: T,
  record: TablesInsert[T]
) {
  const { data } = await supabase
    .from(tableName)
    .insert([record]);
  return data;
}

// Usage
const users = await fetchTable('users'); // Type: User[]
const newExpert = await insertRecord('experts', expertData); // Type-safe insert
```

### 2. Filtering & Querying

Use the filter option types for type-safe query building:

```typescript
import type { UserFilterOptions, AppointmentFilterOptions, ExpertFilterOptions } from '@/lib/types/database.types';

// Type-safe filter options
const userFilters: UserFilterOptions = {
  role: 'expert',
  searchTerm: 'Dr. Smith',
  createdAfter: '2024-01-01T00:00:00Z',
};

const appointmentFilters: AppointmentFilterOptions = {
  status: 'completed',
  paymentStatus: 'paid',
  dateFrom: '2024-01-01T00:00:00Z',
  dateTo: '2024-12-31T23:59:59Z',
};

const expertFilters: ExpertFilterOptions = {
  isApproved: true,
  minRating: 4.0,
  specialization: 'Depression',
};
```

### 3. Role-based Access Control

Use the `UserWithRole` helper type for easier role checking:

```typescript
import { UserRole } from '@/lib/types/database.types';
import type { UserWithRole } from '@/lib/types/database.types';

function createUserWithRole(user: User): UserWithRole {
  return {
    ...user,
    isAdmin: user.role === UserRole.Admin,
    isExpert: user.role === UserRole.Expert,
    isRegularUser: user.role === UserRole.User,
  };
}

// Usage
const userWithRole = createUserWithRole(user);
if (userWithRole.isAdmin) {
  // Admin-only operations
}
```

### 4. Statistics and Analytics

Use the dedicated stats types:

```typescript
import type { ExpertStats, PlatformStats, UserActivity } from '@/lib/types/database.types';

// Expert statistics
const expertStats: ExpertStats = {
  totalAppointments: 50,
  completedAppointments: 48,
  pendingAppointments: 2,
  totalEarnings: 5000,
  averageRating: 4.8,
  totalReviews: 45,
};

// Platform statistics
const platformStats: PlatformStats = {
  totalUsers: 1000,
  totalExperts: 50,
  approvedExperts: 45,
  pendingExpertApprovals: 5,
  totalAppointments: 500,
  completedAppointments: 450,
  totalRevenue: 25000,
  totalMeditations: 100,
  totalCommunityPosts: 250,
  activeChats: 12,
};

// User activity
const userActivity: UserActivity = {
  userId: 'user-123',
  totalMoodEntries: 30,
  totalAppointments: 5,
  completedAppointments: 4,
  totalPostsCreated: 2,
  totalCommentsCreated: 8,
  currentStreak: 15,
  longestStreak: 30,
  lastActivityDate: new Date().toISOString(),
};
```

---

## 🛠️ Integration Examples

### Using with Supabase

```typescript
import { Database } from '@supabase/supabase-js';
import type { User, Appointment, AppointmentInsert } from '@/lib/types/database.types';

const supabase = createClient<Database>(url, key);

// Fetching with type safety
const { data: users } = await supabase
  .from('users')
  .select('*')
  .eq('role', 'admin');
// data is automatically typed as User[]

// Inserting with type safety
const newAppointment: AppointmentInsert = {
  user_id: 'user-123',
  expert_id: 'expert-456',
  appointment_date: new Date().toISOString(),
  duration_minutes: 60,
  call_type: 'video',
  status: 'pending',
  payment_status: 'unpaid',
  refund_status: 'none',
};

const { data: appointment } = await supabase
  .from('appointments')
  .insert([newAppointment]);
// TypeScript ensures newAppointment has all required fields
```

### Using in React Components

```typescript
import { useState } from 'react';
import type { User, Expert, Appointment } from '@/lib/types/database.types';

interface DashboardProps {
  user: User;
  experts: Expert[];
  appointments: Appointment[];
}

export function Dashboard({ user, experts, appointments }: DashboardProps) {
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  
  return (
    <div>
      <h1>{user.full_name}</h1>
      <p>Role: {user.role}</p>
      
      <div>
        <h2>Available Experts ({experts.length})</h2>
        {experts
          .filter(e => e.is_approved)
          .map(expert => (
            <div key={expert.id} onClick={() => setSelectedExpert(expert)}>
              {expert.specialization}
            </div>
          ))}
      </div>
      
      <div>
        <h2>Your Appointments ({appointments.length})</h2>
        {appointments.map(appointment => (
          <div key={appointment.id}>
            Status: {appointment.status} | Call Type: {appointment.call_type}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Using in Server Components

```typescript
import type { User, Expert, AppointmentWithDetails } from '@/lib/types/database.types';

async function getUserAppointments(userId: string): Promise<AppointmentWithDetails[]> {
  const { data } = await supabase
    .from('appointments')
    .select(`
      *,
      user:users(*),
      expert:experts(*),
      expertUser:experts(user:users(*))
    `)
    .eq('user_id', userId);
  
  return data as AppointmentWithDetails[];
}

export async function UserAppointmentsPage({ params }: { params: { id: string } }) {
  const appointments = await getUserAppointments(params.id);
  
  return (
    <div>
      {appointments.map(apt => (
        <div key={apt.id}>
          <h3>{apt.user.full_name} with Dr. {apt.expertUser.full_name}</h3>
          <p>Date: {new Date(apt.appointment_date).toLocaleDateString()}</p>
          <p>Status: {apt.status}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎓 Type Hierarchy

```
TableType (Union of all table types)
├── User
├── Expert
├── ExpertAvailability
├── Appointment
├── Meditation
├── MoodEntry
├── Post
├── PostComment
├── PostLike
├── ChatRoom
├── Message
├── ChatParticipant
├── AIConversation
├── AIMessage
└── Notification

Tables (Mapping table names to types)
├── users: User
├── experts: Expert
├── appointments: Appointment
└── ... (all other tables)

Insert Types
├── UserInsert (omits id, created_at, updated_at)
├── ExpertInsert
├── AppointmentInsert
└── ... (all other insert types)

Update Types
├── UserUpdate (all fields optional, id required)
├── ExpertUpdate
├── AppointmentUpdate
└── ... (all other update types)

Relationship Types
├── ExpertWithUser
├── AppointmentWithDetails
├── PostWithAuthor
└── ChatRoomWithMessages

Utility Types
├── ExpertStats
├── PlatformStats
├── UserActivity
├── UserFilterOptions
├── AppointmentFilterOptions
└── ... (all other utility types)
```

---

## ⚠️ Important Notes

1. **Auto-generated Fields**: Never manually set `id`, `created_at`, or `updated_at` fields when inserting. The database will handle these.

2. **Timestamps**: All timestamp fields are ISO 8601 strings. Convert from/to JavaScript Date objects as needed:
   ```typescript
   const isoString = new Date().toISOString();
   const date = new Date(isoString);
   ```

3. **JSONB Fields**: Fields like `preferences` and `metadata` are stored as JSONB. Cast them appropriately:
   ```typescript
   const preferences = user.preferences as Record<string, any>;
   ```

4. **Array Fields**: Array fields like `goals`, `certificate_urls`, `emotion_factors` can be null or an array:
   ```typescript
   const goals = user.goals || []; // Default to empty array
   ```

5. **Nullable Fields**: Many fields are optional (`| null`). Check before using:
   ```typescript
   if (user.avatar_url) {
     // Safe to use
   }
   ```

6. **Enums**: Always use the enum values for consistency and to avoid typos:
   ```typescript
   // Good
   const role = UserRole.Admin;
   
   // Avoid
   const role = 'admin' as UserRoleType; // Requires casting
   ```

---

## 🔄 Common Patterns

### Pattern 1: Transform Row to Domain Model
```typescript
import type { User } from '@/lib/types/database.types';

function userRowToModel(row: User): UserModel {
  return {
    id: row.id,
    name: row.full_name || 'Unknown',
    email: row.email,
    role: row.role,
    avatar: row.avatar_url,
  };
}
```

### Pattern 2: Filter & Select
```typescript
import type { Expert } from '@/lib/types/database.types';

function filterApprovedExperts(experts: Expert[]): Expert[] {
  return experts.filter(e => e.is_approved);
}

function selectExpertIds(experts: Expert[]): string[] {
  return experts.map(e => e.id);
}
```

### Pattern 3: Merge Partial Updates
```typescript
import type { User, UserUpdate } from '@/lib/types/database.types';

function mergeUserUpdate(original: User, update: Partial<Omit<User, 'id'>>): User {
  return { ...original, ...update, id: original.id };
}
```

---

## 📚 Related Files

- `lib/supabase/client.ts` - Supabase client setup
- `lib/supabase/server.ts` - Server-side operations
- `hooks/use-*.ts` - Custom hooks for data fetching
- `components/` - UI components using these types

---

## ❓ Troubleshooting

**Q: TypeScript says a field is not assignable to type X**
- A: Check that the field type matches the expected type. Use type assertions carefully: `as SomeType`

**Q: I'm getting "Property 'X' does not exist on type 'Y'**
- A: Check the field name spelling and ensure you're using the correct type

**Q: My data doesn't type-check when inserting**
- A: Use the `Insert` types instead of the full types. They exclude auto-generated fields.

**Q: Enum values don't appear in autocomplete**
- A: Make sure you're importing the enum: `import { UserRole } from '@/lib/types/database.types'`

---

Last updated: 2024
For schema updates, edit `database.types.ts` and this guide accordingly.

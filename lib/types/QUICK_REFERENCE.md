/**
 * Quick Reference: TypeScript Types for Mental Health Admin Panel
 * 
 * This is a quick reference guide. For detailed documentation, see TYPES_GUIDE.md
 */

// ============================================================================
// IMPORT PATTERN
// ============================================================================

// Import types
import type {
  User,
  Expert,
  Appointment,
  // ... other types
} from '@/lib/types';

// Import enums
import { UserRole, AppointmentStatus, CallType } from '@/lib/types';

// ============================================================================
// COMMON USE CASES
// ============================================================================

// 1. CREATING RECORDS
import type { UserInsert, AppointmentInsert, MeditationInsert } from '@/lib/types';

const newUser: UserInsert = {
  email: 'user@example.com',
  full_name: 'John Doe',
  role: 'user',
  streak_count: 0,
  longest_streak: 0,
  total_activities: 0,
};

const newAppointment: AppointmentInsert = {
  user_id: 'uuid-1',
  expert_id: 'uuid-2',
  appointment_date: new Date().toISOString(),
  duration_minutes: 60,
  call_type: 'video',
  status: 'pending',
  payment_status: 'unpaid',
  refund_status: 'none',
};

// 2. UPDATING RECORDS
import type { UserUpdate, AppointmentUpdate } from '@/lib/types';

const updateUser: UserUpdate = {
  id: 'uuid-1',
  avatar_url: 'https://example.com/avatar.jpg',
  last_login: new Date().toISOString(),
};

const updateAppointment: AppointmentUpdate = {
  id: 'uuid-1',
  status: 'confirmed',
};

// 3. USING ENUMS
import { UserRole, AppointmentStatus } from '@/lib/types';

const isAdmin = user.role === UserRole.Admin;
const isPending = appointment.status === AppointmentStatus.Pending;

// 4. FILTERING DATA
import type { UserFilterOptions, AppointmentFilterOptions } from '@/lib/types';

const userFilters: UserFilterOptions = {
  role: 'expert',
  searchTerm: 'Dr.',
  createdAfter: '2024-01-01T00:00:00Z',
};

const appointmentFilters: AppointmentFilterOptions = {
  status: 'completed',
  paymentStatus: 'paid',
  dateFrom: '2024-01-01T00:00:00Z',
};

// 5. WORKING WITH RELATIONSHIPS
import type { AppointmentWithDetails, ExpertWithUser } from '@/lib/types';

const appointmentWithDetails: AppointmentWithDetails = {
  // appointment fields...
  user: { /* user data */ },
  expert: { /* expert data */ },
  expertUser: { /* expert's user data */ },
};

const expertData: ExpertWithUser = {
  // expert fields...
  user: { /* user profile */ },
};

// 6. ROLE CHECKING
import type { UserWithRole } from '@/lib/types';

function createUserWithRole(user: User): UserWithRole {
  return {
    ...user,
    isAdmin: user.role === UserRole.Admin,
    isExpert: user.role === UserRole.Expert,
    isRegularUser: user.role === UserRole.User,
  };
}

// 7. STATISTICS & ANALYTICS
import type { ExpertStats, PlatformStats, UserActivity } from '@/lib/types';

const expertStats: ExpertStats = {
  totalAppointments: 50,
  completedAppointments: 48,
  pendingAppointments: 2,
  totalEarnings: 5000,
  averageRating: 4.8,
  totalReviews: 45,
};

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

// ============================================================================
// ENUM VALUES REFERENCE
// ============================================================================

// UserRole values
type UserRoleValues = 'admin' | 'expert' | 'user';
// Usage: user.role === 'admin' or user.role === UserRole.Admin

// AppointmentStatus values
type AppointmentStatusValues = 'pending' | 'confirmed' | 'cancelled' | 'completed';
// Usage: appointment.status === 'confirmed' or appointment.status === AppointmentStatus.Confirmed

// CallType values
type CallTypeValues = 'chat' | 'video' | 'audio';

// MeditationLevel values
type MeditationLevelValues = 'beginner' | 'intermediate' | 'advanced';

// MessageRole values
type MessageRoleValues = 'user' | 'assistant' | 'system';

// PaymentStatus values
type PaymentStatusValues = 'unpaid' | 'paid' | 'refunded';

// RefundStatus values
type RefundStatusValues = 'none' | 'pending' | 'completed';

// ============================================================================
// TABLE TYPES QUICK REFERENCE
// ============================================================================

/*
User
├── id: string
├── email: string
├── full_name: string | null
├── avatar_url: string | null
├── role: UserRoleType
├── streak_count: number
├── longest_streak: number
├── date_of_birth: string | null
├── gender: string | null
├── goals: string[] | null
├── preferences: Record<string, any> | null
├── last_login: string | null
├── total_activities: number
├── created_at: string
└── updated_at: string

Expert
├── id: string
├── bio: string | null
├── specialization: string | null
├── hourly_rate: number
├── rating: number
├── total_reviews: number
├── is_approved: boolean
├── years_experience: number
├── license_number: string | null
├── license_url: string | null
├── certificate_urls: string[] | null
├── education: string | null
├── university: string | null
├── graduation_year: number | null
├── title: string | null
├── created_at: string
└── updated_at: string

Appointment
├── id: string
├── user_id: string
├── expert_id: string
├── appointment_date: string
├── duration_minutes: number
├── call_type: CallTypeType
├── status: AppointmentStatusType
├── payment_status: PaymentStatusType
├── payment_id: string | null
├── payment_trans_id: string | null
├── expert_base_price: number | null
├── user_notes: string | null
├── cancelled_at: string | null
├── cancelled_by: string | null
├── cancelled_role: string | null
├── cancellation_reason: string | null
├── refund_status: RefundStatusType
├── created_at: string
└── updated_at: string

Meditation
├── id: string
├── title: string
├── description: string | null
├── category: string | null
├── duration_minutes: number | null
├── audio_url: string
├── thumbnail_url: string | null
├── level: MeditationLevelType
├── rating: number
├── total_reviews: number
├── created_at: string
└── updated_at: string

Post
├── id: string
├── author_id: string
├── title: string
├── content: string
├── image_url: string | null
├── category: string
├── is_anonymous: boolean
├── likes_count: number
├── comment_count: number
├── created_at: string
└── updated_at: string
*/

// ============================================================================
// TYPESCRIPT PATTERNS
// ============================================================================

// Pattern 1: Defensive null checks
function getUserName(user: User | null): string {
  return user?.full_name || 'Anonymous';
}

// Pattern 2: Type guards
function isAdmin(user: User): boolean {
  return user.role === UserRole.Admin;
}

// Pattern 3: Optional chaining
const expertBio = expert?.bio ?? 'No bio provided';

// Pattern 4: Array operations
const expertIds: string[] = experts.map(e => e.id);
const activeExperts = experts.filter(e => e.is_approved);

// Pattern 5: Partial updates
const partial: Partial<User> = {
  avatar_url: 'new-url',
};

// Pattern 6: Required fields
type UserRequired = Required<User>;
type SomeRequired = Required<Pick<User, 'full_name' | 'avatar_url'>>;

// ============================================================================
// SUPABASE INTEGRATION PATTERNS
// ============================================================================

// Pattern 1: Fetching with type inference
const { data: users, error } = await supabase
  .from('users')
  .select('*')
  .eq('role', 'expert');
// data automatically typed as User[] | null

// Pattern 2: Inserting with type safety
const { data: newUser } = await supabase
  .from('users')
  .insert([userInsertData])
  .select();
// userInsertData must conform to UserInsert type

// Pattern 3: Updating with type safety
const { data: updated } = await supabase
  .from('users')
  .update({ avatar_url: 'new-url' })
  .eq('id', userId)
  .select();

// Pattern 4: Complex queries with relations
const { data: appointments } = await supabase
  .from('appointments')
  .select(`
    *,
    user:users(*),
    expert:experts(*)
  `)
  .eq('user_id', userId);
// Type this as AppointmentWithDetails[]

// ============================================================================
// REACT/NEXT.JS PATTERNS
// ============================================================================

// Pattern 1: State management
import { useState } from 'react';

function UserEditor() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  return <div>{user?.full_name}</div>;
}

// Pattern 2: Props typing
interface UserCardProps {
  user: User;
  onEdit: (user: UserUpdate) => Promise<void>;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  return <div>{user.full_name}</div>;
}

// Pattern 3: Form data typing
function AppointmentForm() {
  const [formData, setFormData] = useState<AppointmentInsert>({
    user_id: '',
    expert_id: '',
    appointment_date: '',
    duration_minutes: 60,
    call_type: 'video',
    status: 'pending',
    payment_status: 'unpaid',
    refund_status: 'none',
  });
}

// ============================================================================
// COMMON MISTAKES TO AVOID
// ============================================================================

// ❌ DON'T: Try to set auto-generated fields when creating
const badInsert: UserInsert = {
  email: 'test@example.com',
  full_name: 'Test',
  role: 'user',
  id: 'should-not-be-here', // ❌ TYPE ERROR
  created_at: new Date().toISOString(), // ❌ TYPE ERROR
};

// ✅ DO: Only set business fields
const goodInsert: UserInsert = {
  email: 'test@example.com',
  full_name: 'Test',
  role: 'user',
  streak_count: 0,
  longest_streak: 0,
  total_activities: 0,
};

// ❌ DON'T: Forget the id when updating
const badUpdate: UserUpdate = {
  avatar_url: 'new-url',
  // ❌ Missing id - TYPE ERROR
};

// ✅ DO: Always include id in updates
const goodUpdate: UserUpdate = {
  id: 'user-123',
  avatar_url: 'new-url',
};

// ❌ DON'T: Use string values for enums without type checking
const status: string = 'pending';
if (status === AppointmentStatus.Pending) { // May warn in strict mode
}

// ✅ DO: Use proper typing
const status: AppointmentStatusType = 'pending';
if (status === AppointmentStatus.Pending) {
}

// ============================================================================
// HELP & RESOURCES
// ============================================================================

// For detailed documentation, see: lib/types/TYPES_GUIDE.md
// For all type definitions, see: lib/types/database.types.ts
// For quick imports, use: import type { ... } from '@/lib/types';

// Questions?
// 1. Check TYPES_GUIDE.md for examples
// 2. Check database.types.ts for JSDoc comments
// 3. Check your IDE's intellisense (hover over types)
// 4. Use TypeScript strict mode for better type checking

export {};

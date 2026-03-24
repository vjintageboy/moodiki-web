/**
 * TypeScript Types Usage Examples
 * 
 * This file contains practical examples of how to use the database types
 * in real React components and server-side operations.
 * 
 * Run this file as a reference (not executable - it's just examples)
 */

// ============================================================================
// BASIC IMPORTS
// ============================================================================

import type {
  User,
  Expert,
  Appointment,
  Meditation,
  MoodEntry,
  Post,
  PostComment,
  ChatRoom,
  Message,
  AIConversation,
  AIMessage,
  Notification,
  // Insert types
  UserInsert,
  AppointmentInsert,
  MeditationInsert,
  // Update types
  UserUpdate,
  AppointmentUpdate,
  // Relationship types
  ExpertWithUser,
  AppointmentWithDetails,
  PostWithAuthor,
  // Filter types
  UserFilterOptions,
  AppointmentFilterOptions,
  ExpertFilterOptions,
  // Statistics
  ExpertStats,
  PlatformStats,
  UserActivity,
} from '@/lib/types';

import {
  UserRole,
  AppointmentStatus,
  CallType,
  MeditationLevel,
  MessageRole,
  PaymentStatus,
  RefundStatus,
} from '@/lib/types';

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// EXAMPLE 1: REACT COMPONENT WITH TYPED PROPS
// ============================================================================

interface UserProfileCardProps {
  user: User;
  onUpdate: (update: UserUpdate) => Promise<void>;
  isLoading?: boolean;
}

export function UserProfileCard({
  user,
  onUpdate,
  isLoading = false,
}: UserProfileCardProps) {
  return (
    <div className="user-card">
      <img src={user.avatar_url ?? '/default-avatar.png'} alt={user.full_name ?? ''} />
      <h2>{user.full_name}</h2>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <p>Streak: {user.streak_count} days</p>

      <button
        onClick={async () => {
          await onUpdate({
            id: user.id,
            last_login: new Date().toISOString(),
          });
        }}
        disabled={isLoading}
      >
        Update Last Login
      </button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: FORM WITH INSERT TYPE
// ============================================================================

interface CreateUserFormProps {
  onSubmit: (user: UserInsert) => Promise<void>;
}

export function CreateUserForm({ onSubmit }: CreateUserFormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newUser: UserInsert = {
      email: formData.get('email') as string,
      full_name: formData.get('fullName') as string,
      role: (formData.get('role') as any) || 'user',
      streak_count: 0,
      longest_streak: 0,
      total_activities: 0,
      avatar_url: null,
      date_of_birth: null,
      gender: null,
      goals: [],
      preferences: {},
      last_login: null,
    };

    await onSubmit(newUser);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required placeholder="Email" />
      <input name="fullName" type="text" required placeholder="Full Name" />
      <select name="role">
        <option value={UserRole.User}>User</option>
        <option value={UserRole.Expert}>Expert</option>
        <option value={UserRole.Admin}>Admin</option>
      </select>
      <button type="submit">Create User</button>
    </form>
  );
}

// ============================================================================
// EXAMPLE 3: TABLE COMPONENT WITH FILTERING
// ============================================================================

interface AppointmentTableProps {
  appointments: AppointmentWithDetails[];
  filters: AppointmentFilterOptions;
  onFilterChange: (filters: AppointmentFilterOptions) => void;
}

export function AppointmentTable({
  appointments,
  filters,
  onFilterChange,
}: AppointmentTableProps) {
  return (
    <div>
      <div className="filters">
        <select
          value={filters.status || ''}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              status: (e.target.value as AppointmentStatus) || undefined,
            })
          }
        >
          <option value="">All Statuses</option>
          <option value={AppointmentStatus.Pending}>Pending</option>
          <option value={AppointmentStatus.Confirmed}>Confirmed</option>
          <option value={AppointmentStatus.Completed}>Completed</option>
          <option value={AppointmentStatus.Cancelled}>Cancelled</option>
        </select>

        <select
          value={filters.paymentStatus || ''}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              paymentStatus: (e.target.value as PaymentStatus) || undefined,
            })
          }
        >
          <option value="">All Payment Statuses</option>
          <option value={PaymentStatus.Unpaid}>Unpaid</option>
          <option value={PaymentStatus.Paid}>Paid</option>
          <option value={PaymentStatus.Refunded}>Refunded</option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Expert</th>
            <th>Date</th>
            <th>Call Type</th>
            <th>Status</th>
            <th>Payment</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((apt) => (
            <tr key={apt.id}>
              <td>{apt.user.full_name}</td>
              <td>Dr. {apt.expertUser.full_name}</td>
              <td>{new Date(apt.appointment_date).toLocaleDateString()}</td>
              <td>{apt.call_type}</td>
              <td>{apt.status}</td>
              <td>{apt.payment_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: EXPERT APPROVAL COMPONENT
// ============================================================================

interface ExpertApprovalProps {
  experts: Expert[];
  onApprove: (expertId: string) => Promise<void>;
  onReject: (expertId: string) => Promise<void>;
}

export function ExpertApprovalList({
  experts,
  onApprove,
  onReject,
}: ExpertApprovalProps) {
  const pendingExperts = experts.filter((e) => !e.is_approved);

  return (
    <div>
      <h2>Pending Expert Approvals ({pendingExperts.length})</h2>

      {pendingExperts.map((expert) => (
        <div key={expert.id} className="expert-card">
          <h3>{expert.title} {expert.university}</h3>
          <p>Specialization: {expert.specialization}</p>
          <p>Experience: {expert.years_experience} years</p>
          <p>License: {expert.license_number}</p>
          <p>Rating: {expert.rating}/5.0 ({expert.total_reviews} reviews)</p>

          <div className="bio">{expert.bio}</div>

          <div className="actions">
            <button onClick={() => onApprove(expert.id)} className="approve">
              Approve
            </button>
            <button onClick={() => onReject(expert.id)} className="reject">
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: SERVER-SIDE DATA FETCHING
// ============================================================================

// Server Component Example (Next.js 14)
async function getUserAppointments(userId: string): Promise<AppointmentWithDetails[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('appointments')
    .select(
      `
      *,
      user:users(*),
      expert:experts(*),
      expertUser:experts(user:users(*))
    `
    )
    .eq('user_id', userId)
    .order('appointment_date', { ascending: false });

  if (error) throw error;
  return (data || []) as AppointmentWithDetails[];
}

// ============================================================================
// EXAMPLE 6: CREATE/UPDATE OPERATIONS
// ============================================================================

async function createAppointment(
  userId: string,
  expertId: string,
  appointmentDate: string
): Promise<Appointment> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const appointmentData: AppointmentInsert = {
    user_id: userId,
    expert_id: expertId,
    appointment_date: appointmentDate,
    duration_minutes: 60,
    call_type: CallType.Video,
    status: AppointmentStatus.Pending,
    payment_status: PaymentStatus.Unpaid,
    refund_status: RefundStatus.None,
    payment_id: null,
    payment_trans_id: null,
    expert_base_price: 0,
    user_notes: null,
    cancelled_at: null,
    cancelled_by: null,
    cancelled_role: null,
    cancellation_reason: null,
  };

  const { data, error } = await supabase
    .from('appointments')
    .insert([appointmentData])
    .select()
    .single();

  if (error) throw error;
  return data as Appointment;
}

async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus
): Promise<Appointment> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const update: AppointmentUpdate = {
    id: appointmentId,
    status: newStatus,
  };

  const { data, error } = await supabase
    .from('appointments')
    .update(update)
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) throw error;
  return data as Appointment;
}

// ============================================================================
// EXAMPLE 7: ADMIN DASHBOARD WITH STATISTICS
// ============================================================================

async function getPlatformStatistics(): Promise<PlatformStats> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all required data
  const [
    { count: userCount },
    { count: expertCount },
    { data: approvedExperts },
    { data: appointments },
    { data: meditations },
    { data: posts },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact' }).limit(1),
    supabase.from('experts').select('*', { count: 'exact' }).limit(1),
    supabase.from('experts').select('id').eq('is_approved', true),
    supabase.from('appointments').select('*'),
    supabase.from('meditations').select('*', { count: 'exact' }).limit(1),
    supabase.from('posts').select('*', { count: 'exact' }).limit(1),
  ]);

  const completedAppointments =
    (appointments || []).filter((a) => a.status === AppointmentStatus.Completed)
      .length || 0;
  const totalRevenue = (appointments || [])
    .filter((a) => a.payment_status === PaymentStatus.Paid)
    .reduce((sum, a) => sum + (a.expert_base_price || 0), 0);

  return {
    totalUsers: userCount || 0,
    totalExperts: expertCount || 0,
    approvedExperts: approvedExperts?.length || 0,
    pendingExpertApprovals: (expertCount || 0) - (approvedExperts?.length || 0),
    totalAppointments: appointments?.length || 0,
    completedAppointments,
    totalRevenue,
    totalMeditations: meditations?.length || 0,
    totalCommunityPosts: posts?.length || 0,
    activeChats: 0, // Would calculate from chat_rooms
  };
}

// ============================================================================
// EXAMPLE 8: MEDITATION LISTING WITH LEVEL FILTERING
// ============================================================================

interface MeditationListProps {
  meditations: Meditation[];
  selectedLevel?: MeditationLevel;
  onLevelChange: (level: MeditationLevel | undefined) => void;
}

export function MeditationList({
  meditations,
  selectedLevel,
  onLevelChange,
}: MeditationListProps) {
  const filtered = selectedLevel
    ? meditations.filter((m) => m.level === selectedLevel)
    : meditations;

  return (
    <div>
      <div className="filters">
        <button
          onClick={() => onLevelChange(undefined)}
          className={!selectedLevel ? 'active' : ''}
        >
          All Levels
        </button>
        <button
          onClick={() => onLevelChange(MeditationLevel.Beginner)}
          className={selectedLevel === MeditationLevel.Beginner ? 'active' : ''}
        >
          Beginner
        </button>
        <button
          onClick={() => onLevelChange(MeditationLevel.Intermediate)}
          className={selectedLevel === MeditationLevel.Intermediate ? 'active' : ''}
        >
          Intermediate
        </button>
        <button
          onClick={() => onLevelChange(MeditationLevel.Advanced)}
          className={selectedLevel === MeditationLevel.Advanced ? 'active' : ''}
        >
          Advanced
        </button>
      </div>

      <div className="meditation-grid">
        {filtered.map((meditation) => (
          <div key={meditation.id} className="meditation-card">
            <img src={meditation.thumbnail_url || ''} alt={meditation.title} />
            <h3>{meditation.title}</h3>
            <p>{meditation.description}</p>
            <div className="metadata">
              <span className="level">{meditation.level}</span>
              <span className="duration">{meditation.duration_minutes} min</span>
              <span className="rating">⭐ {meditation.rating}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 9: POST WITH COMMENTS (RELATIONSHIP TYPES)
// ============================================================================

interface PostDetailProps {
  post: PostWithAuthor;
  comments: PostComment[];
  onAddComment: (content: string) => Promise<void>;
}

export function PostDetail({ post, comments, onAddComment }: PostDetailProps) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div className="author">
        <img src={post.author.avatar_url ?? ''} alt={post.author.full_name ?? ''} />
        <span>{post.author.full_name}</span>
        <span className="date">
          {new Date(post.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="content">{post.content}</div>

      {post.image_url && <img src={post.image_url} alt="Post image" />}

      <div className="stats">
        <span>{post.likes_count} likes</span>
        <span>{post.comment_count} comments</span>
      </div>

      <section className="comments">
        <h2>Comments ({comments.length})</h2>
        {comments.map((comment) => (
          <div key={comment.id} className="comment">
            <p className="content">{comment.content}</p>
            <time>{new Date(comment.created_at).toLocaleDateString()}</time>
          </div>
        ))}

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const content = new FormData(form).get('content') as string;
            await onAddComment(content);
            form.reset();
          }}
        >
          <textarea name="content" placeholder="Add a comment..." required />
          <button type="submit">Post Comment</button>
        </form>
      </section>
    </article>
  );
}

// ============================================================================
// EXAMPLE 10: AI CONVERSATION WITH MESSAGE HISTORY
// ============================================================================

interface AIConversationViewProps {
  conversation: AIConversation;
  messages: AIMessage[];
  onSendMessage: (content: string) => Promise<void>;
}

export function AIConversationView({
  conversation,
  messages,
  onSendMessage,
}: AIConversationViewProps) {
  return (
    <div className="conversation">
      <h2>{conversation.title || 'Untitled Conversation'}</h2>

      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="role-badge">{message.role}</div>
            <div className="content">{message.content}</div>
            {message.metadata && (
              <div className="metadata">
                <small>
                  Model: {message.model_name} | Tokens: {message.total_tokens}
                </small>
              </div>
            )}
            <time>{new Date(message.created_at).toLocaleTimeString()}</time>
          </div>
        ))}
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const content = new FormData(form).get('message') as string;
          await onSendMessage(content);
          form.reset();
        }}
      >
        <textarea name="message" placeholder="Type your message..." required />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

// ============================================================================
// EXAMPLE 11: ROLE-BASED RENDERING
// ============================================================================

interface AdminPanelProps {
  user: User;
  children: React.ReactNode;
}

export function AdminPanelGuard({ user, children }: AdminPanelProps) {
  // Type-safe role checking
  if (user.role !== UserRole.Admin) {
    return <div>Access Denied. Admin role required.</div>;
  }

  return <>{children}</>;
}

// ============================================================================
// EXAMPLE 12: MOOD TRACKING
// ============================================================================

interface MoodEntryFormProps {
  onSubmit: (entry: MoodEntry) => Promise<void>;
}

export function MoodEntryForm({ onSubmit }: MoodEntryFormProps) {
  const emotionOptions = ['work', 'family', 'health', 'relationships', 'finances'];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const moodScore = parseInt(formData.get('mood') as string);
    const emotionFactors = emotionOptions.filter((option) =>
      formData.get(`emotion-${option}`)
    );

    const entry: Omit<MoodEntry, 'id' | 'created_at' | 'updated_at'> = {
      user_id: '', // Set by caller
      mood_score: moodScore,
      note: (formData.get('note') as string) || null,
      emotion_factors: emotionFactors.length > 0 ? emotionFactors : null,
      tags: [],
    };

    await onSubmit(entry as MoodEntry);
  };

  return (
    <form onSubmit={handleSubmit} className="mood-entry-form">
      <div className="mood-slider">
        <label htmlFor="mood">How are you feeling?</label>
        <input
          id="mood"
          name="mood"
          type="range"
          min="1"
          max="5"
          required
        />
        <div className="mood-labels">
          <span>Very Bad</span>
          <span>Bad</span>
          <span>Neutral</span>
          <span>Good</span>
          <span>Very Good</span>
        </div>
      </div>

      <div className="emotions">
        <label>Contributing factors:</label>
        {emotionOptions.map((option) => (
          <label key={option}>
            <input name={`emotion-${option}`} type="checkbox" />
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </label>
        ))}
      </div>

      <textarea
        name="note"
        placeholder="Add any notes about how you're feeling..."
      />

      <button type="submit">Save Entry</button>
    </form>
  );
}

// ============================================================================
// EXPORT EXAMPLES FOR USE
// ============================================================================

export {
  getUserAppointments,
  createAppointment,
  updateAppointmentStatus,
  getPlatformStatistics,
};

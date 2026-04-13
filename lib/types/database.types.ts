/**
 * Mental Health Admin Panel Database Types
 * 
 * This file contains comprehensive TypeScript types for the Mental Health Platform database,
 * including tables, enums, and utility types for type-safe operations.
 * 
 * @generated Manually created based on admin-panel-prompt.md schema specification
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * User roles in the system
 * - admin: Platform administrator with full access
 * - expert: Mental health professional (therapist, counselor, etc.)
 * - user: Regular user of the platform
 */
export enum UserRole {
  Admin = 'admin',
  Expert = 'expert',
  User = 'user',
}

export type UserRoleType = 'admin' | 'expert' | 'user';

/**
 * Status of an appointment
 * - pending: Appointment requested, awaiting confirmation
 * - confirmed: Appointment confirmed by expert
 * - cancelled: Appointment cancelled by either party
 * - completed: Appointment completed
 */
export enum AppointmentStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
  Completed = 'completed',
}

export type AppointmentStatusType = 'pending' | 'confirmed' | 'cancelled' | 'completed';

/**
 * Types of communication for appointments
 * - chat: Text-based chat communication
 * - video: Video call communication
 * - audio: Audio call communication
 */
export enum CallType {
  Chat = 'chat',
  Video = 'video',
  Audio = 'audio',
}

export type CallTypeType = 'chat' | 'video' | 'audio';

/**
 * Difficulty level for meditation sessions
 * - beginner: Entry-level sessions for newcomers
 * - intermediate: Standard sessions for regular practitioners
 * - advanced: Complex sessions for experienced meditators
 */
export enum MeditationLevel {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

export type MeditationLevelType = 'beginner' | 'intermediate' | 'advanced';

/**
 * Role of message sender in AI conversations
 * - user: Message from the user
 * - assistant: Message from the AI assistant
 * - system: System message with context or instructions
 */
export enum MessageRole {
  User = 'user',
  Assistant = 'assistant',
  System = 'system',
}

export type MessageRoleType = 'user' | 'assistant' | 'system';

/**
 * Payment status for appointments
 * - unpaid: Payment not yet received
 * - paid: Payment successfully processed
 * - refunded: Payment refunded to user
 */
export enum PaymentStatus {
  Unpaid = 'unpaid',
  Paid = 'paid',
  Refunded = 'refunded',
}

export type PaymentStatusType = 'unpaid' | 'paid' | 'refunded';

/**
 * Refund status for appointments
 * - none: No refund request
 * - pending: Refund requested, awaiting processing
 * - completed: Refund successfully processed
 */
export enum RefundStatus {
  None = 'none',
  Pending = 'pending',
  Completed = 'completed',
}

export type RefundStatusType = 'none' | 'pending' | 'completed';

// ============================================================================
// TABLE TYPES
// ============================================================================

/**
 * Users table type
 * Represents a user in the system with profile information and statistics
 */
export interface User {
  id: string; // UUID, linked to auth.users(id)
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRoleType;
  is_locked: boolean; // Admin feature
  streak_count: number;
  longest_streak: number;
  date_of_birth: string | null; // ISO timestamp
  gender: string | null;
  phone_number: string | null;
  goals: string[] | null; // Array of goal strings
  preferences: Record<string, any> | null; // JSONB
  last_login: string | null; // ISO timestamp
  total_activities: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Experts table type
 * Represents a mental health expert/professional profile
 */
export interface Expert {
  id: string; // UUID, foreign key to users(id)
  bio: string | null;
  specialization: string | null; // e.g., "Anxiety", "Depression", "Stress"
  hourly_rate: number;
  rating: number;
  total_reviews: number;
  is_approved: boolean;
  years_experience: number;
  license_number: string | null;
  license_url: string | null;
  certificate_urls: string[] | null;
  education: string | null;
  university: string | null;
  graduation_year: number | null;
  title: string | null; // e.g., "Dr.", "Ms."
  rejection_reason: string | null; // Admin moderation — migration 008
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Expert availability slots
 * Represents when an expert is available for appointments
 */
export interface ExpertAvailability {
  id: string; // UUID
  expert_id: string; // UUID, foreign key to experts(id)
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:MM:SS format
  end_time: string; // HH:MM:SS format
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Appointments table type
 * Represents an appointment between a user and an expert
 */
export interface Appointment {
  id: string; // UUID
  user_id: string; // UUID, foreign key to users(id)
  expert_id: string; // UUID, foreign key to experts(id)
  appointment_date: string; // ISO timestamp
  duration_minutes: number;
  call_type: CallTypeType;
  status: AppointmentStatusType;
  payment_status: PaymentStatusType;
  payment_id: string | null;
  payment_trans_id: string | null;
  expert_base_price: number | null;
  user_notes: string | null;
  cancelled_at: string | null; // ISO timestamp
  cancelled_by: string | null; // UUID
  cancelled_role: string | null; // 'admin', 'expert', 'user'
  cancellation_reason: string | null;
  refund_status: RefundStatusType;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Meditations table type
 * Represents a meditation audio content item
 */
export interface Meditation {
  id: string; // UUID
  title: string;
  description: string | null;
  category: string | null; // e.g., "Sleep", "Anxiety", "Mindfulness"
  duration_minutes: number | null;
  audio_url: string;
  thumbnail_url: string | null;
  level: MeditationLevelType;
  rating: number;
  total_reviews: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Mood entries table type
 * Represents a user's mood check-in
 */
export interface MoodEntry {
  id: string; // UUID
  user_id: string; // UUID, foreign key to users(id)
  mood_score: number; // 1-5 scale
  note: string | null;
  emotion_factors: string[] | null; // e.g., ["work", "family", "health"]
  tags: string[] | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Posts table type
 * Represents a community forum post
 */
export interface Post {
  id: string; // UUID
  author_id: string; // UUID, foreign key to users(id)
  title: string;
  content: string;
  image_url: string | null;
  category: string;
  is_anonymous: boolean;
  is_hidden: boolean; // Admin soft-moderation flag — migration 009
  flagged: boolean; // AI moderation flag
  likes_count: number;
  comment_count: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Reports table type
 * Represents a user report on a post
 */
export interface Report {
  id: string; // UUID
  post_id: string; // UUID, foreign key to posts(id)
  user_id: string; // UUID, foreign key to users(id)
  reason: string;
  created_at: string; // ISO timestamp
}

/**
 * Post comments table type
 * Represents a comment on a post
 */
export interface PostComment {
  id: string; // UUID
  post_id: string; // UUID, foreign key to posts(id)
  user_id: string; // UUID, foreign key to users(id)
  content: string;
  parent_comment_id: string | null; // UUID for nested comments
  is_anonymous: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Post likes table type
 * Represents a like on a post
 */
export interface PostLike {
  id: string; // UUID
  post_id: string; // UUID, foreign key to posts(id)
  user_id: string; // UUID, foreign key to users(id)
  created_at: string; // ISO timestamp
}

/**
 * Chat rooms table type
 * Represents a chat conversation space
 */
export interface ChatRoom {
  id: string; // UUID
  appointment_id: string | null; // UUID, nullable foreign key
  status: string; // 'active', 'inactive', etc.
  last_message: string | null;
  last_message_time: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Messages table type
 * Represents a message in a chat room
 */
export interface Message {
  id: string; // UUID
  room_id: string; // UUID, foreign key to chat_rooms(id)
  sender_id: string; // UUID, foreign key to users(id)
  content: string;
  type: string; // 'text', 'image', 'file', etc.
  is_pinned: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Chat participants table type
 * Represents membership in a chat room
 */
export interface ChatParticipant {
  room_id: string; // UUID, foreign key to chat_rooms(id)
  user_id: string; // UUID, foreign key to users(id)
}

/**
 * AI conversations table type
 * Represents a conversation with the AI assistant
 */
export interface AIConversation {
  id: string; // UUID
  user_id: string; // UUID, foreign key to users(id)
  title: string | null;
  last_message_preview: string | null;
  is_archived: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * AI messages table type
 * Represents a message in an AI conversation
 */
export interface AIMessage {
  id: string; // UUID
  conversation_id: string; // UUID, foreign key to ai_conversations(id)
  user_id: string; // UUID, foreign key to users(id)
  role: MessageRoleType; // 'user', 'assistant', 'system'
  content: string;
  model_name: string | null;
  metadata: Record<string, any> | null; // JSONB
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  latency_ms: number | null;
  created_at: string; // ISO timestamp
}

/**
 * Notifications table type
 * Represents a notification sent to a user
 */
export interface Notification {
  id: string; // UUID
  user_id: string; // UUID, foreign key to users(id)
  title: string;
  message: string;
  type: string; // 'appointment', 'message', 'system', etc.
  is_read: boolean;
  metadata: Record<string, any> | null; // JSONB
  created_at: string; // ISO timestamp
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Union type of all database table types
 */
export type TableType =
  | User
  | Expert
  | ExpertAvailability
  | Appointment
  | Meditation
  | MoodEntry
  | Post
  | PostComment
  | PostLike
  | ChatRoom
  | Message
  | ChatParticipant
  | AIConversation
  | AIMessage
  | Notification
  | Report;

/**
 * Mapping of table names to their types
 * Useful for generic database operations
 */
export type Tables = {
  users: User;
  experts: Expert;
  expert_availability: ExpertAvailability;
  appointments: Appointment;
  meditations: Meditation;
  mood_entries: MoodEntry;
  posts: Post;
  post_comments: PostComment;
  post_likes: PostLike;
  chat_rooms: ChatRoom;
  messages: Message;
  chat_participants: ChatParticipant;
  ai_conversations: AIConversation;
  ai_messages: AIMessage;
  notifications: Notification;
  reports: Report;
};

// ============================================================================
// INSERT TYPES (For Creating Records)
// ============================================================================

/**
 * Type for inserting a new user
 * Omits auto-generated fields: id, created_at, updated_at
 */
export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'>;

/**
 * Type for inserting a new expert
 */
export type ExpertInsert = Omit<Expert, 'created_at' | 'updated_at'>;

/**
 * Type for inserting a new expert availability slot
 */
export type ExpertAvailabilityInsert = Omit<
  ExpertAvailability,
  'id' | 'created_at' | 'updated_at'
>;

/**
 * Type for inserting a new appointment
 */
export type AppointmentInsert = Omit<
  Appointment,
  'id' | 'created_at' | 'updated_at'
>;

/**
 * Type for inserting a new meditation
 */
export type MeditationInsert = Omit<Meditation, 'id' | 'created_at' | 'updated_at'>;

/**
 * Type for inserting a new mood entry
 */
export type MoodEntryInsert = Omit<MoodEntry, 'id' | 'created_at' | 'updated_at'>;

/**
 * Type for inserting a new post
 */
export type PostInsert = Omit<Post, 'id' | 'created_at' | 'updated_at'>;

/**
 * Type for inserting a new post comment
 */
export type PostCommentInsert = Omit<PostComment, 'id' | 'created_at' | 'updated_at'>;

/**
 * Type for inserting a new post like
 */
export type PostLikeInsert = Omit<PostLike, 'id' | 'created_at'>;

/**
 * Type for inserting a new chat room
 */
export type ChatRoomInsert = Omit<ChatRoom, 'id' | 'created_at' | 'updated_at'>;

/**
 * Type for inserting a new message
 */
export type MessageInsert = Omit<Message, 'id' | 'created_at' | 'updated_at'>;

/**
 * Type for adding a chat participant
 */
export type ChatParticipantInsert = ChatParticipant;

/**
 * Type for inserting a new AI conversation
 */
export type AIConversationInsert = Omit<
  AIConversation,
  'id' | 'created_at' | 'updated_at'
>;

/**
 * Type for inserting a new AI message
 */
export type AIMessageInsert = Omit<AIMessage, 'id' | 'created_at'>;

/**
 * Type for inserting a new notification
 */
export type NotificationInsert = Omit<Notification, 'id' | 'created_at'>;

/**
 * Type for inserting a new report
 */
export type ReportInsert = Omit<Report, 'id' | 'created_at'>;

/**
 * Mapping of table names to their insert types
 */
export type TablesInsert = {
  users: UserInsert;
  experts: ExpertInsert;
  expert_availability: ExpertAvailabilityInsert;
  appointments: AppointmentInsert;
  meditations: MeditationInsert;
  mood_entries: MoodEntryInsert;
  posts: PostInsert;
  post_comments: PostCommentInsert;
  post_likes: PostLikeInsert;
  chat_rooms: ChatRoomInsert;
  messages: MessageInsert;
  chat_participants: ChatParticipantInsert;
  ai_conversations: AIConversationInsert;
  ai_messages: AIMessageInsert;
  notifications: NotificationInsert;
  reports: ReportInsert;
};

// ============================================================================
// UPDATE TYPES (For Updating Records)
// ============================================================================

/**
 * Type for updating a user (all fields optional except id)
 */
export type UserUpdate = Partial<Omit<User, 'id'>> & { id: string };

/**
 * Type for updating an expert
 */
export type ExpertUpdate = Partial<Omit<Expert, 'id'>> & { id: string };

/**
 * Type for updating expert availability
 */
export type ExpertAvailabilityUpdate = Partial<
  Omit<ExpertAvailability, 'id'>
> & { id: string };

/**
 * Type for updating an appointment
 */
export type AppointmentUpdate = Partial<Omit<Appointment, 'id'>> & { id: string };

/**
 * Type for updating a meditation
 */
export type MeditationUpdate = Partial<Omit<Meditation, 'id'>> & { id: string };

/**
 * Type for updating a mood entry
 */
export type MoodEntryUpdate = Partial<Omit<MoodEntry, 'id'>> & { id: string };

/**
 * Type for updating a post
 */
export type PostUpdate = Partial<Omit<Post, 'id'>> & { id: string };

/**
 * Type for updating a post comment
 */
export type PostCommentUpdate = Partial<Omit<PostComment, 'id'>> & { id: string };

/**
 * Type for updating a chat room
 */
export type ChatRoomUpdate = Partial<Omit<ChatRoom, 'id'>> & { id: string };

/**
 * Type for updating a message
 */
export type MessageUpdate = Partial<Omit<Message, 'id'>> & { id: string };

/**
 * Type for updating an AI conversation
 */
export type AIConversationUpdate = Partial<Omit<AIConversation, 'id'>> & {
  id: string;
};

/**
 * Type for updating an AI message
 */
export type AIMessageUpdate = Partial<Omit<AIMessage, 'id'>> & { id: string };

/**
 * Type for updating a notification
 */
export type NotificationUpdate = Partial<Omit<Notification, 'id'>> & {
  id: string;
};

/**
 * Mapping of table names to their update types
 */
export type TablesUpdate = {
  users: UserUpdate;
  experts: ExpertUpdate;
  expert_availability: ExpertAvailabilityUpdate;
  appointments: AppointmentUpdate;
  meditations: MeditationUpdate;
  mood_entries: MoodEntryUpdate;
  posts: PostUpdate;
  post_comments: PostCommentUpdate;
  post_likes: PostLikeInsert; // PostLike is always insert-only
  chat_rooms: ChatRoomUpdate;
  messages: MessageUpdate;
  chat_participants: ChatParticipantInsert; // ChatParticipant is insert-only
  ai_conversations: AIConversationUpdate;
  ai_messages: AIMessageUpdate;
  notifications: NotificationUpdate;
};

// ============================================================================
// JOINED/RELATIONSHIP TYPES
// ============================================================================

/**
 * User with role-related helper information
 * Useful for displaying user role and checking permissions
 */
export interface UserWithRole extends User {
  isAdmin: boolean;
  isExpert: boolean;
  isRegularUser: boolean;
}

/**
 * Expert joined with their user profile data
 * Provides complete expert information including user details
 */
export interface ExpertWithUser extends Expert {
  user: User;
}

/**
 * Appointment with related user and expert data
 * Provides complete appointment context with all related information
 */
export interface AppointmentWithDetails extends Appointment {
  user: User;
  expert: Expert;
  expertUser: User;
}

/**
 * Chat room with messages and participants
 */
export interface ChatRoomWithMessages extends ChatRoom {
  messages: Message[];
  participants: ChatParticipant[];
}

/**
 * Post with author information
 */
export interface PostWithAuthor extends Post {
  author: User;
}

/**
 * Post comment with author information
 */
export interface PostCommentWithAuthor extends PostComment {
  author: User;
}

/**
 * AI conversation with messages
 */
export interface AIConversationWithMessages extends AIConversation {
  messages: AIMessage[];
}

/**
 * Meditation with user rating (if user has rated)
 */
export interface MeditationWithUserRating extends Meditation {
  userRating?: number;
}

/**
 * Appointment statistics for an expert
 * Used in analytics and dashboard
 */
export interface ExpertStats {
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
}

/**
 * Appointment statistics for the platform
 * Used in analytics and dashboard
 */
export interface PlatformStats {
  totalUsers: number;
  totalExperts: number;
  approvedExperts: number;
  pendingExpertApprovals: number;
  totalAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  totalMeditations: number;
  totalCommunityPosts: number;
  activeChats: number;
}

/**
 * User activity summary
 * Useful for user profile and analytics
 */
export interface UserActivity {
  userId: string;
  totalMoodEntries: number;
  totalAppointments: number;
  completedAppointments: number;
  totalPostsCreated: number;
  totalCommentsCreated: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

// ============================================================================
// FILTER & QUERY HELPER TYPES
// ============================================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * User filter options
 */
export interface UserFilterOptions {
  role?: UserRoleType;
  searchTerm?: string;
  lastLoginAfter?: string;
  createdAfter?: string;
}

/**
 * Expert filter options
 */
export interface ExpertFilterOptions {
  isApproved?: boolean;
  specialization?: string;
  minRating?: number;
  minYearsExperience?: number;
  searchTerm?: string;
}

/**
 * Appointment filter options
 */
export interface AppointmentFilterOptions {
  status?: AppointmentStatusType;
  paymentStatus?: PaymentStatusType;
  expertId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Meditation filter options
 */
export interface MeditationFilterOptions {
  level?: MeditationLevelType;
  category?: string;
  minDuration?: number;
  maxDuration?: number;
  minRating?: number;
  searchTerm?: string;
}

/**
 * Mood entry filter options
 */
export interface MoodEntryFilterOptions {
  userId?: string;
  minMoodScore?: number;
  maxMoodScore?: number;
  dateFrom?: string;
  dateTo?: string;
  emotionFactor?: string;
}

/**
 * Generic database query response
 */
export interface DatabaseQueryResult<T> {
  data: T[];
  count: number;
  error: null;
}

/**
 * Generic database error response
 */
export interface DatabaseErrorResult {
  data: null;
  count: 0;
  error: Error;
}

/**
 * Generic database response type
 */
export type DatabaseResponse<T> = DatabaseQueryResult<T> | DatabaseErrorResult;

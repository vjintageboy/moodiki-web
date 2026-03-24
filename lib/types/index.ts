/**
 * Central export file for all database types
 * 
 * This file re-exports all types from database.types.ts
 * for convenient importing throughout the application.
 * 
 * Usage:
 *   import type { User, Appointment } from '@/lib/types';
 *   import { UserRole, AppointmentStatus } from '@/lib/types';
 */

// ============================================================================
// ENUMS
// ============================================================================
export {
  UserRole,
  AppointmentStatus,
  CallType,
  MeditationLevel,
  MessageRole,
  PaymentStatus,
  RefundStatus,
} from './database.types';

export type {
  UserRoleType,
  AppointmentStatusType,
  CallTypeType,
  MeditationLevelType,
  MessageRoleType,
  PaymentStatusType,
  RefundStatusType,
} from './database.types';

// ============================================================================
// TABLE TYPES
// ============================================================================
export type {
  User,
  Expert,
  ExpertAvailability,
  Appointment,
  Meditation,
  MoodEntry,
  Post,
  PostComment,
  PostLike,
  ChatRoom,
  Message,
  ChatParticipant,
  AIConversation,
  AIMessage,
  Notification,
} from './database.types';

// ============================================================================
// UNION & MAPPING TYPES
// ============================================================================
export type { TableType, Tables } from './database.types';

// ============================================================================
// INSERT TYPES
// ============================================================================
export type {
  UserInsert,
  ExpertInsert,
  ExpertAvailabilityInsert,
  AppointmentInsert,
  MeditationInsert,
  MoodEntryInsert,
  PostInsert,
  PostCommentInsert,
  PostLikeInsert,
  ChatRoomInsert,
  MessageInsert,
  ChatParticipantInsert,
  AIConversationInsert,
  AIMessageInsert,
  NotificationInsert,
  TablesInsert,
} from './database.types';

// ============================================================================
// UPDATE TYPES
// ============================================================================
export type {
  UserUpdate,
  ExpertUpdate,
  ExpertAvailabilityUpdate,
  AppointmentUpdate,
  MeditationUpdate,
  MoodEntryUpdate,
  PostUpdate,
  PostCommentUpdate,
  ChatRoomUpdate,
  MessageUpdate,
  AIConversationUpdate,
  AIMessageUpdate,
  NotificationUpdate,
  TablesUpdate,
} from './database.types';

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================
export type {
  UserWithRole,
  ExpertWithUser,
  AppointmentWithDetails,
  ChatRoomWithMessages,
  PostWithAuthor,
  PostCommentWithAuthor,
  AIConversationWithMessages,
  MeditationWithUserRating,
} from './database.types';

// ============================================================================
// STATISTICS & ANALYTICS TYPES
// ============================================================================
export type {
  ExpertStats,
  PlatformStats,
  UserActivity,
} from './database.types';

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================
export type {
  PaginationParams,
  SortOrder,
  UserFilterOptions,
  ExpertFilterOptions,
  AppointmentFilterOptions,
  MeditationFilterOptions,
  MoodEntryFilterOptions,
  DatabaseQueryResult,
  DatabaseErrorResult,
  DatabaseResponse,
} from './database.types';

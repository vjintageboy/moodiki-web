import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * File size limits by bucket (in bytes)
 */
const FILE_SIZE_LIMITS: Record<string, number> = {
  avatars: 5 * 1024 * 1024, // 5 MB
  'meditation-audio': 100 * 1024 * 1024, // 100 MB
  'meditation-thumbnails': 10 * 1024 * 1024, // 10 MB
  'expert-documents': 20 * 1024 * 1024, // 20 MB
  'post-images': 15 * 1024 * 1024, // 15 MB
};

/**
 * Allowed MIME types by bucket
 */
const ALLOWED_TYPES: Record<string, string[]> = {
  avatars: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  'meditation-audio': ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  'meditation-thumbnails': ['image/jpeg', 'image/png', 'image/webp'],
  'expert-documents': ['application/pdf', 'image/jpeg', 'image/png'],
  'post-images': ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
};

/**
 * Custom error class for storage operations
 */
export class StorageError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Validate file before upload
 */
function validateFile(
  file: File,
  bucket: string
): { valid: boolean; error?: string } {
  const sizeLimit = FILE_SIZE_LIMITS[bucket];
  const allowedTypes = ALLOWED_TYPES[bucket];

  if (!sizeLimit) {
    return { valid: false, error: `Unknown bucket: ${bucket}` };
  }

  if (!allowedTypes) {
    return { valid: false, error: `Unknown bucket: ${bucket}` };
  }

  if (file.size > sizeLimit) {
    const limitMB = (sizeLimit / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size exceeds limit of ${limitMB}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Generate a unique file path with timestamp
 */
function generatePath(basePath: string, fileName: string): string {
  const timestamp = Date.now();
  const ext = fileName.split('.').pop();
  const nameWithoutExt = fileName.replace(`.${ext}`, '');
  return `${basePath}/${timestamp}-${nameWithoutExt}.${ext}`;
}

/**
 * Upload a file to a storage bucket
 * @param bucket - Bucket name
 * @param path - File path (can include folder structure)
 * @param file - File to upload
 * @returns Public URL if successful
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  try {
    // Validate file
    const validation = validateFile(file, bucket);
    if (!validation.valid) {
      throw new StorageError(
        'VALIDATION_ERROR',
        validation.error || 'File validation failed'
      );
    }

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new StorageError(
        error.name || 'UPLOAD_ERROR',
        error.message,
        400
      );
    }

    // Generate and return public URL
    return getPublicUrl(bucket, data.path);
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new StorageError('UPLOAD_ERROR', message);
  }
}

/**
 * Delete a file from a storage bucket
 * @param bucket - Bucket name
 * @param path - File path
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw new StorageError(
        error.name || 'DELETE_ERROR',
        error.message,
        400
      );
    }
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new StorageError('DELETE_ERROR', message);
  }
}

/**
 * Get public URL for a file
 * @param bucket - Bucket name
 * @param path - File path
 * @returns Public URL
 */
export function getPublicUrl(bucket: string, path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    throw new StorageError('CONFIG_ERROR', 'Supabase URL not configured');
  }

  return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Upload user avatar
 * @param userId - User ID for folder structure
 * @param file - Avatar file
 * @returns Public URL
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  try {
    if (!userId) {
      throw new StorageError(
        'VALIDATION_ERROR',
        'User ID is required for avatar upload'
      );
    }

    // Validate file
    const validation = validateFile(file, 'avatars');
    if (!validation.valid) {
      throw new StorageError(
        'VALIDATION_ERROR',
        validation.error || 'File validation failed'
      );
    }

    // Generate path with user ID as folder
    const path = generatePath(userId, file.name);

    // Delete old avatar if exists
    try {
      const { data: files } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (files && files.length > 0) {
        const oldFile = files[0];
        await deleteFile('avatars', `${userId}/${oldFile.name}`);
      }
    } catch (error) {
      // Ignore error if folder doesn't exist
      console.warn('Could not delete old avatar');
    }

    // Upload new avatar
    return uploadFile('avatars', path, file);
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new StorageError('AVATAR_UPLOAD_ERROR', message);
  }
}

/**
 * Upload meditation audio file
 * @param file - Audio file
 * @returns Public URL
 */
export async function uploadMeditationAudio(file: File): Promise<string> {
  try {
    // Validate file
    const validation = validateFile(file, 'meditation-audio');
    if (!validation.valid) {
      throw new StorageError(
        'VALIDATION_ERROR',
        validation.error || 'File validation failed'
      );
    }

    // Generate unique path
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const path = `meditation-${timestamp}.${ext}`;

    // Upload file
    return uploadFile('meditation-audio', path, file);
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new StorageError('AUDIO_UPLOAD_ERROR', message);
  }
}

/**
 * Upload meditation thumbnail/cover image
 * @param file - Thumbnail file
 * @returns Public URL
 */
export async function uploadMeditationThumbnail(file: File): Promise<string> {
  try {
    // Validate file
    const validation = validateFile(file, 'meditation-thumbnails');
    if (!validation.valid) {
      throw new StorageError(
        'VALIDATION_ERROR',
        validation.error || 'File validation failed'
      );
    }

    // Generate unique path
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const path = `thumbnail-${timestamp}.${ext}`;

    // Upload file
    return uploadFile('meditation-thumbnails', path, file);
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new StorageError('THUMBNAIL_UPLOAD_ERROR', message);
  }
}

/**
 * Upload expert document (certificate, license, etc.)
 * @param expertId - Expert ID for folder structure
 * @param file - Document file
 * @returns Public URL (will be access-restricted by RLS)
 */
export async function uploadExpertDocument(
  expertId: string,
  file: File
): Promise<string> {
  try {
    if (!expertId) {
      throw new StorageError(
        'VALIDATION_ERROR',
        'Expert ID is required for document upload'
      );
    }

    // Validate file
    const validation = validateFile(file, 'expert-documents');
    if (!validation.valid) {
      throw new StorageError(
        'VALIDATION_ERROR',
        validation.error || 'File validation failed'
      );
    }

    // Generate path with expert ID as folder
    const path = generatePath(expertId, file.name);

    // Upload file
    return uploadFile('expert-documents', path, file);
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new StorageError('DOCUMENT_UPLOAD_ERROR', message);
  }
}

/**
 * Upload post image
 * @param userId - User ID for folder structure
 * @param file - Image file
 * @returns Public URL
 */
export async function uploadPostImage(
  userId: string,
  file: File
): Promise<string> {
  try {
    if (!userId) {
      throw new StorageError(
        'VALIDATION_ERROR',
        'User ID is required for post image upload'
      );
    }

    // Validate file
    const validation = validateFile(file, 'post-images');
    if (!validation.valid) {
      throw new StorageError(
        'VALIDATION_ERROR',
        validation.error || 'File validation failed'
      );
    }

    // Generate path with user ID as folder
    const path = generatePath(userId, file.name);

    // Upload file
    return uploadFile('post-images', path, file);
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new StorageError('POST_IMAGE_UPLOAD_ERROR', message);
  }
}

/**
 * Delete avatar for a user
 * @param userId - User ID
 * @param fileName - File name to delete
 */
export async function deleteAvatar(
  userId: string,
  fileName: string
): Promise<void> {
  return deleteFile('avatars', `${userId}/${fileName}`);
}

/**
 * Delete expert document
 * @param expertId - Expert ID
 * @param fileName - File name to delete
 */
export async function deleteExpertDocument(
  expertId: string,
  fileName: string
): Promise<void> {
  return deleteFile('expert-documents', `${expertId}/${fileName}`);
}

/**
 * Delete post image
 * @param userId - User ID
 * @param fileName - File name to delete
 */
export async function deletePostImage(
  userId: string,
  fileName: string
): Promise<void> {
  return deleteFile('post-images', `${userId}/${fileName}`);
}

/**
 * List files in a bucket folder
 * @param bucket - Bucket name
 * @param path - Folder path
 * @returns Array of file objects
 */
export async function listFiles(bucket: string, path: string) {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(path);

    if (error) {
      throw new StorageError(
        error.name || 'LIST_ERROR',
        error.message,
        400
      );
    }

    return data || [];
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new StorageError('LIST_ERROR', message);
  }
}

/**
 * Download a file from storage
 * @param bucket - Bucket name
 * @param path - File path
 * @returns File data as Blob
 */
export async function downloadFile(bucket: string, path: string): Promise<Blob> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) {
      throw new StorageError(
        error.name || 'DOWNLOAD_ERROR',
        error.message,
        400
      );
    }

    return data;
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new StorageError('DOWNLOAD_ERROR', message);
  }
}

/**
 * Create a signed URL for private file access
 * @param bucket - Bucket name
 * @param path - File path
 * @param expiresIn - Expiry time in seconds (default: 3600)
 * @returns Signed URL
 */
export async function createSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new StorageError(
        error.name || 'SIGNED_URL_ERROR',
        error.message,
        400
      );
    }

    return data.signedUrl;
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new StorageError('SIGNED_URL_ERROR', message);
  }
}

/**
 * Get file metadata
 * @param bucket - Bucket name
 * @param path - File path
 * @returns File metadata
 */
export async function getFileMetadata(bucket: string, path: string) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .info(path);

    if (error) {
      throw new StorageError(
        error.name || 'METADATA_ERROR',
        error.message,
        400
      );
    }

    return data;
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new StorageError('METADATA_ERROR', message);
  }
}

export default {
  uploadFile,
  deleteFile,
  getPublicUrl,
  uploadAvatar,
  uploadMeditationAudio,
  uploadMeditationThumbnail,
  uploadExpertDocument,
  uploadPostImage,
  deleteAvatar,
  deleteExpertDocument,
  deletePostImage,
  listFiles,
  downloadFile,
  createSignedUrl,
  getFileMetadata,
  StorageError,
};

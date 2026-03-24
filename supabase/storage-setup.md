# Supabase Storage Setup Guide

This guide provides instructions for setting up Storage buckets for the Mental Health Admin Panel.

## Overview

The application uses five Storage buckets to manage different types of files:

| Bucket | Visibility | Purpose |
|--------|-----------|---------|
| `avatars` | Public | User and expert profile pictures |
| `meditation-audio` | Public | Meditation audio files |
| `meditation-thumbnails` | Public | Meditation cover images |
| `expert-documents` | Private | Expert licenses and certificates |
| `post-images` | Public | Community post images |

## Bucket Configuration

### 1. Avatars Bucket (Public)
**Purpose**: Store user and expert profile pictures  
**Size Limit**: 5 MB per file  
**Allowed Types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

#### SQL Setup
```sql
-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read avatars
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Policy: Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

#### Usage
```typescript
import { uploadAvatar } from '@/lib/supabase/storage';

const file = new File(['...'], 'profile.jpg', { type: 'image/jpeg' });
const publicUrl = await uploadAvatar(userId, file);
```

---

### 2. Meditation Audio Bucket (Public)
**Purpose**: Store meditation audio files  
**Size Limit**: 100 MB per file  
**Allowed Types**: `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/webm`

#### SQL Setup
```sql
-- Create the meditation-audio bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('meditation-audio', 'meditation-audio', true)
ON CONFLICT DO NOTHING;

-- Policy: Public read access
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'meditation-audio');

-- Policy: Only admins can upload meditation audio
CREATE POLICY "Admins can upload meditation audio" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'meditation-audio' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Only admins can update meditation audio
CREATE POLICY "Admins can update meditation audio" ON storage.objects
  FOR UPDATE WITH CHECK (
    bucket_id = 'meditation-audio' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Only admins can delete meditation audio
CREATE POLICY "Admins can delete meditation audio" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'meditation-audio' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );
```

#### Usage
```typescript
import { uploadMeditationAudio } from '@/lib/supabase/storage';

const audioFile = new File(['...'], 'meditation.mp3', { type: 'audio/mpeg' });
const publicUrl = await uploadMeditationAudio(audioFile);
```

---

### 3. Meditation Thumbnails Bucket (Public)
**Purpose**: Store meditation cover/thumbnail images  
**Size Limit**: 10 MB per file  
**Allowed Types**: `image/jpeg`, `image/png`, `image/webp`

#### SQL Setup
```sql
-- Create the meditation-thumbnails bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('meditation-thumbnails', 'meditation-thumbnails', true)
ON CONFLICT DO NOTHING;

-- Policy: Public read access
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'meditation-thumbnails');

-- Policy: Only admins can upload meditation thumbnails
CREATE POLICY "Admins can upload meditation thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'meditation-thumbnails' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Only admins can update meditation thumbnails
CREATE POLICY "Admins can update meditation thumbnails" ON storage.objects
  FOR UPDATE WITH CHECK (
    bucket_id = 'meditation-thumbnails' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Only admins can delete meditation thumbnails
CREATE POLICY "Admins can delete meditation thumbnails" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'meditation-thumbnails' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );
```

#### Usage
```typescript
import { uploadMeditationThumbnail } from '@/lib/supabase/storage';

const thumbnailFile = new File(['...'], 'thumbnail.jpg', { type: 'image/jpeg' });
const publicUrl = await uploadMeditationThumbnail(thumbnailFile);
```

---

### 4. Expert Documents Bucket (Private)
**Purpose**: Store expert licenses and certificates  
**Size Limit**: 20 MB per file  
**Allowed Types**: `application/pdf`, `image/jpeg`, `image/png`

#### SQL Setup
```sql
-- Create the expert-documents bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('expert-documents', 'expert-documents', false)
ON CONFLICT DO NOTHING;

-- Policy: Admins and the expert can read their documents
CREATE POLICY "Admins and experts can read documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'expert-documents' AND
    (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'admin'
      ) OR
      auth.uid()::text = (storage.foldername(name))[1]
    )
  );

-- Policy: Admins can upload expert documents
CREATE POLICY "Admins can upload expert documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'expert-documents' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Experts can upload their own documents
CREATE POLICY "Experts can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'expert-documents' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'expert'
    )
  );

-- Policy: Admins and experts can update their documents
CREATE POLICY "Admins and experts can update documents" ON storage.objects
  FOR UPDATE WITH CHECK (
    bucket_id = 'expert-documents' AND
    (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'admin'
      ) OR
      (
        auth.uid()::text = (storage.foldername(name))[1] AND
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND raw_user_meta_data->>'role' = 'expert'
        )
      )
    )
  );

-- Policy: Admins and experts can delete their documents
CREATE POLICY "Admins and experts can delete documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'expert-documents' AND
    (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'admin'
      ) OR
      (
        auth.uid()::text = (storage.foldername(name))[1] AND
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND raw_user_meta_data->>'role' = 'expert'
        )
      )
    )
  );
```

#### Usage
```typescript
import { uploadFile } from '@/lib/supabase/storage';

const document = new File(['...'], 'certificate.pdf', { type: 'application/pdf' });
const path = `${expertId}/certificate.pdf`;
const publicUrl = await uploadFile('expert-documents', path, document);
```

---

### 5. Post Images Bucket (Public)
**Purpose**: Store community post images  
**Size Limit**: 15 MB per file  
**Allowed Types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

#### SQL Setup
```sql
-- Create the post-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT DO NOTHING;

-- Policy: Public read access
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-images');

-- Policy: Authenticated users can upload post images
CREATE POLICY "Authenticated users can upload post images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-images' AND
    auth.role() = 'authenticated'
  );

-- Policy: Users can update their own post images
CREATE POLICY "Users can update their own post images" ON storage.objects
  FOR UPDATE WITH CHECK (
    bucket_id = 'post-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own post images
CREATE POLICY "Users can delete their own post images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

#### Usage
```typescript
import { uploadFile } from '@/lib/supabase/storage';

const image = new File(['...'], 'post.jpg', { type: 'image/jpeg' });
const path = `${userId}/${Date.now()}-post.jpg`;
const publicUrl = await uploadFile('post-images', path, image);
```

---

## File Size Limits & Validation

| Bucket | Max Size | Allowed Types |
|--------|----------|---------------|
| avatars | 5 MB | JPEG, PNG, WebP, GIF |
| meditation-audio | 100 MB | MP3, WAV, OGG, WebM |
| meditation-thumbnails | 10 MB | JPEG, PNG, WebP |
| expert-documents | 20 MB | PDF, JPEG, PNG |
| post-images | 15 MB | JPEG, PNG, WebP, GIF |

## Implementation

See `lib/supabase/storage.ts` for TypeScript helper functions that:
- Handle file validation and size checks
- Manage uploads and deletions
- Generate public URLs
- Include comprehensive error handling

### Helper Functions

1. **uploadFile(bucket, path, file)** - Generic file upload with validation
2. **deleteFile(bucket, path)** - Delete a file from a bucket
3. **getPublicUrl(bucket, path)** - Generate a public URL for a file
4. **uploadAvatar(userId, file)** - Upload user avatar with auto-sizing
5. **uploadMeditationAudio(file)** - Upload meditation audio with validation
6. **uploadMeditationThumbnail(file)** - Upload meditation thumbnail with optimization

## Deployment Steps

1. Run all SQL scripts in your Supabase SQL editor in the following order:
   - avatars bucket creation and policies
   - meditation-audio bucket creation and policies
   - meditation-thumbnails bucket creation and policies
   - expert-documents bucket creation and policies
   - post-images bucket creation and policies

2. Verify bucket creation in Supabase Storage dashboard

3. Test uploads using the helper functions in `lib/supabase/storage.ts`

4. Monitor RLS policy enforcement in Supabase Logs

## Security Considerations

- All buckets use Row Level Security (RLS) for access control
- Private bucket (expert-documents) cannot be accessed via unauthenticated requests
- User IDs are extracted from folder names for ownership validation
- Admin role is checked via JWT claims in `raw_user_meta_data`
- File types are validated on both client and server side

## Troubleshooting

### 403 Forbidden Errors
- Verify RLS policies are enabled on the storage schema
- Check that user has correct role in `raw_user_meta_data`
- Ensure folder structure follows expected format (userId as first folder)

### Upload Failures
- Validate file size against limits
- Check MIME type is in allowed list
- Verify user authentication token is valid
- Check network connectivity

### Missing Public URLs
- Ensure bucket is marked as public in configuration
- Verify RLS SELECT policy allows public access
- Check that file path is correct and file exists

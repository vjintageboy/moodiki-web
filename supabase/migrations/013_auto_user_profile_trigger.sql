-- ==============================================================================
-- Auto User Profile Creation Trigger
-- ==============================================================================
-- Migration: 013_auto_user_profile_trigger.sql
-- Purpose: Automatically create user profile in public.users when auth user is created
-- 
-- This trigger ensures that whenever a new user is created in auth.users
-- (via admin API, signup, OAuth, etc.), a corresponding profile is automatically
-- created in public.users table with metadata from user_metadata.
--
-- Benefits:
-- - Prevents duplicate profile creation errors
-- - Follows Supabase best practices
-- - Works for ALL user creation methods
-- - Simplifies application code
-- ==============================================================================

-- ==============================================================================
-- STEP 1: Create the trigger function
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert new profile into public.users
  -- Extract metadata from auth.users.raw_user_meta_data
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- Extract full_name from user_metadata, default to empty string
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    -- Extract role from user_metadata, cast to enum, default to 'user'
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'::user_role),
    NOW(),
    NOW()
  )
  -- Idempotent: Don't fail if user profile already exists
  -- This prevents duplicate errors if trigger runs multiple times
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent user creation in auth.users
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates user profile in public.users when new auth user is created. Extracts full_name and role from user_metadata.';

-- ==============================================================================
-- STEP 2: Create the trigger
-- ==============================================================================

-- Drop trigger if it already exists (for idempotent migration)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires after user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment to trigger
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 
'Triggers handle_new_user() function to auto-create profile in public.users';

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================
-- Run these queries to verify the trigger is created:
--
-- 1. Check function exists:
--    SELECT routine_name FROM information_schema.routines 
--    WHERE routine_schema = 'public' AND routine_name = 'handle_new_user';
--
-- 2. Check trigger exists:
--    SELECT trigger_name FROM information_schema.triggers 
--    WHERE event_object_table = 'users' AND trigger_name = 'on_auth_user_created';
--
-- 3. Test trigger (creates test user):
--    -- This will create both auth user AND profile automatically
--    INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data)
--    VALUES ('test@example.com', crypt('password123', gen_salt('bf')), NOW(), 
--            '{"full_name": "Test User", "role": "user"}'::jsonb);
--
--    -- Verify profile was created:
--    SELECT * FROM public.users WHERE email = 'test@example.com';
--
--    -- Clean up test user:
--    DELETE FROM auth.users WHERE email = 'test@example.com';
--    DELETE FROM public.users WHERE email = 'test@example.com';
-- ==============================================================================

-- ==============================================================================
-- ROLLBACK (if needed)
-- ==============================================================================
-- To rollback this migration, run:
--
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- ==============================================================================

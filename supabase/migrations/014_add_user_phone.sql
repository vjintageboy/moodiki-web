-- =====================================================
-- Migration: 014_add_user_phone.sql
-- Purpose: Add phone_number column to users table and update trigger
-- =====================================================

-- 1. Add phone_number column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- 2. Update handle_new_user trigger function to include phone_number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    phone_number,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'::user_role),
    NEW.raw_user_meta_data->>'phone_number',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

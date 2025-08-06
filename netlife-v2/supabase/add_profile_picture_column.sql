-- Add profile picture column to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_profile_picture ON public.profiles(profile_picture) WHERE profile_picture IS NOT NULL;

-- Add helpful comment
COMMENT ON COLUMN public.profiles.profile_picture IS 'Profile picture URL or avatar identifier';

-- Verify the column was added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'profile_picture'
    ) THEN
        RAISE EXCEPTION 'Failed to add profile_picture column to profiles table';
    END IF;
    
    RAISE NOTICE 'Profile picture column successfully added to profiles table';
END $$;
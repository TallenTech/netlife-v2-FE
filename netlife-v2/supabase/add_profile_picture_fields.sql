-- Add profile picture fields to profiles table
-- Run this in Supabase SQL Editor

-- Add profile picture columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS profile_picture_type TEXT CHECK (profile_picture_type IN ('upload', 'avatar')),
ADD COLUMN IF NOT EXISTS avatar_id TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_picture_type ON public.profiles(profile_picture_type);
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_id ON public.profiles(avatar_id);

-- Add helpful comments
COMMENT ON COLUMN public.profiles.profile_picture_url IS 'URL to profile picture (either uploaded image or avatar URL)';
COMMENT ON COLUMN public.profiles.profile_picture_type IS 'Type of profile picture: upload (custom) or avatar (predefined)';
COMMENT ON COLUMN public.profiles.avatar_id IS 'ID of selected avatar (only used when profile_picture_type is avatar)';

-- Create avatars reference table for predefined avatars
CREATE TABLE IF NOT EXISTS public.avatars (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample avatars (you can customize these)
INSERT INTO public.avatars (id, name, url, category) VALUES
('avatar_male_1', 'Male Avatar 1', '/avatars/male_1.png', 'male'),
('avatar_male_2', 'Male Avatar 2', '/avatars/male_2.png', 'male'),
('avatar_male_3', 'Male Avatar 3', '/avatars/male_3.png', 'male'),
('avatar_female_1', 'Female Avatar 1', '/avatars/female_1.png', 'female'),
('avatar_female_2', 'Female Avatar 2', '/avatars/female_2.png', 'female'),
('avatar_female_3', 'Female Avatar 3', '/avatars/female_3.png', 'female'),
('avatar_neutral_1', 'Neutral Avatar 1', '/avatars/neutral_1.png', 'neutral'),
('avatar_neutral_2', 'Neutral Avatar 2', '/avatars/neutral_2.png', 'neutral'),
('avatar_business_1', 'Business Avatar 1', '/avatars/business_1.png', 'business'),
('avatar_business_2', 'Business Avatar 2', '/avatars/business_2.png', 'business')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on avatars table
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

-- Create policy for avatars (read-only for authenticated users)
CREATE POLICY "Avatars are viewable by authenticated users" ON public.avatars
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Add foreign key constraint (optional, for data integrity)
-- ALTER TABLE public.profiles 
-- ADD CONSTRAINT fk_profiles_avatar_id 
-- FOREIGN KEY (avatar_id) REFERENCES public.avatars(id);

-- Verify the columns were added
DO $$
BEGIN
    -- Check if all new columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'profile_picture_url'
    ) THEN
        RAISE EXCEPTION 'Failed to add profile_picture_url column to profiles table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'profile_picture_type'
    ) THEN
        RAISE EXCEPTION 'Failed to add profile_picture_type column to profiles table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar_id'
    ) THEN
        RAISE EXCEPTION 'Failed to add avatar_id column to profiles table';
    END IF;
    
    RAISE NOTICE 'Profile picture fields successfully added to profiles table';
END $$;
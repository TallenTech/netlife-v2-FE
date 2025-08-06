-- Add additional profile fields to the profiles table
-- This migration adds username, DOB, gender, and location fields

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS sub_county TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Create index for location searches
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(district, sub_county);

-- Create index for updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at);

-- Add constraint for username format (alphanumeric, underscore, hyphen, 3-30 chars)
ALTER TABLE public.profiles 
ADD CONSTRAINT username_format_check 
CHECK (username ~ '^[a-zA-Z0-9_-]{3,30}$');

-- Add constraint for reasonable date of birth (not in future, not too old)
ALTER TABLE public.profiles 
ADD CONSTRAINT dob_reasonable_check 
CHECK (date_of_birth <= CURRENT_DATE AND date_of_birth >= '1900-01-01');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON COLUMN public.profiles.username IS 'Unique username for the user (3-30 chars, alphanumeric, underscore, hyphen)';
COMMENT ON COLUMN public.profiles.date_of_birth IS 'User date of birth';
COMMENT ON COLUMN public.profiles.gender IS 'User gender (male, female, other, prefer_not_to_say)';
COMMENT ON COLUMN public.profiles.district IS 'User district location';
COMMENT ON COLUMN public.profiles.sub_county IS 'User sub county location (optional)';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp when profile was last updated';

-- Create districts reference table for validation (Uganda districts)
CREATE TABLE IF NOT EXISTS public.districts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    region TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some common Uganda districts (you can add more as needed)
INSERT INTO public.districts (name, region) VALUES
('Kampala', 'Central'),
('Wakiso', 'Central'),
('Mukono', 'Central'),
('Jinja', 'Eastern'),
('Mbale', 'Eastern'),
('Gulu', 'Northern'),
('Lira', 'Northern'),
('Mbarara', 'Western'),
('Fort Portal', 'Western'),
('Masaka', 'Central'),
('Entebbe', 'Central'),
('Soroti', 'Eastern'),
('Arua', 'Northern'),
('Kabale', 'Western'),
('Hoima', 'Western')
ON CONFLICT (name) DO NOTHING;

-- Create sub_counties reference table
CREATE TABLE IF NOT EXISTS public.sub_counties (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    district_id INTEGER REFERENCES public.districts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, district_id)
);

-- Add some sample sub counties for Kampala
INSERT INTO public.sub_counties (name, district_id) VALUES
('Central Division', (SELECT id FROM public.districts WHERE name = 'Kampala')),
('Kawempe Division', (SELECT id FROM public.districts WHERE name = 'Kampala')),
('Makindye Division', (SELECT id FROM public.districts WHERE name = 'Kampala')),
('Nakawa Division', (SELECT id FROM public.districts WHERE name = 'Kampala')),
('Rubaga Division', (SELECT id FROM public.districts WHERE name = 'Kampala'))
ON CONFLICT (name, district_id) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_counties ENABLE ROW LEVEL SECURITY;

-- Create policies for districts and sub_counties (read-only for authenticated users)
CREATE POLICY "Districts are viewable by authenticated users" ON public.districts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Sub counties are viewable by authenticated users" ON public.sub_counties
    FOR SELECT USING (auth.role() = 'authenticated');

-- Update existing RLS policies for profiles to include new columns
-- (The existing policies should still work, but let's make sure they cover the new fields)

-- Verify the migration completed successfully
DO $$
BEGIN
    -- Check if all new columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'username'
    ) THEN
        RAISE EXCEPTION 'Failed to add username column to profiles table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'date_of_birth'
    ) THEN
        RAISE EXCEPTION 'Failed to add date_of_birth column to profiles table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'gender'
    ) THEN
        RAISE EXCEPTION 'Failed to add gender column to profiles table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'district'
    ) THEN
        RAISE EXCEPTION 'Failed to add district column to profiles table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'sub_county'
    ) THEN
        RAISE EXCEPTION 'Failed to add sub_county column to profiles table';
    END IF;
    
    RAISE NOTICE 'Profile fields migration completed successfully';
END $$;
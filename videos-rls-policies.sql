-- Row Level Security Policies for videos table
-- NetLife Health Application
-- Run this in your Supabase SQL Editor

-- Enable RLS on the videos table
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Videos are publicly viewable" ON videos;
DROP POLICY IF EXISTS "Admins can manage videos" ON videos;

-- 1. POLICY: Videos are publicly viewable by all authenticated users
-- Health education videos should be accessible to all users
CREATE POLICY "Videos are publicly viewable" ON videos
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

-- 2. POLICY: Only admins and content managers can insert/update/delete videos
CREATE POLICY "Admins can manage videos" ON videos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (
                auth.users.raw_user_meta_data->>'role' = 'admin'
                OR auth.users.raw_user_meta_data->>'role' = 'content_manager'
                OR auth.users.raw_user_meta_data->>'role' = 'healthcare_provider'
            )
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (
                auth.users.raw_user_meta_data->>'role' = 'admin'
                OR auth.users.raw_user_meta_data->>'role' = 'content_manager'
                OR auth.users.raw_user_meta_data->>'role' = 'healthcare_provider'
            )
        )
    );

-- Grant necessary permissions
GRANT SELECT ON videos TO authenticated;
GRANT ALL ON videos TO service_role;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_source ON videos(source);
CREATE INDEX IF NOT EXISTS idx_videos_title ON videos USING gin(to_tsvector('english', title));

-- Simple policy alternative (if you don't have role-based system)
-- Uncomment this and comment out the role-based policies above

/*
-- Allow all authenticated users to view videos
CREATE POLICY "All authenticated users can view videos" ON videos
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- For development: Allow all authenticated users to manage videos
-- (Remove this in production!)
CREATE POLICY "Development: All users can manage videos" ON videos
    FOR ALL USING (auth.uid() IS NOT NULL);
*/
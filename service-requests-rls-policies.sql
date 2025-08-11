-- Row Level Security Policies for service_requests table
-- NetLife Health Application
-- Run this in your Supabase SQL Editor

-- First, enable RLS on the service_requests table
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (clean slate)
DROP POLICY IF EXISTS "Users can view their own service requests" ON service_requests;
DROP POLICY IF EXISTS "Users can create their own service requests" ON service_requests;
DROP POLICY IF EXISTS "Users can update their own service requests" ON service_requests;
DROP POLICY IF EXISTS "Healthcare providers can view all service requests" ON service_requests;
DROP POLICY IF EXISTS "Healthcare providers can update service requests" ON service_requests;

-- 1. POLICY: Users can view their own service requests
CREATE POLICY "Users can view their own service requests" ON service_requests
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- 2. POLICY: Users can create their own service requests
CREATE POLICY "Users can create their own service requests" ON service_requests
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND auth.uid() IS NOT NULL
    );

-- 3. POLICY: Users can update their own service requests (limited fields)
-- Users should only be able to update certain fields like status updates from their side
CREATE POLICY "Users can update their own service requests" ON service_requests
    FOR UPDATE USING (
        auth.uid() = user_id
    ) WITH CHECK (
        auth.uid() = user_id
        -- Prevent users from changing critical fields
        AND OLD.user_id = NEW.user_id
        AND OLD.service_id = NEW.service_id
        AND OLD.created_at = NEW.created_at
    );

-- 4. POLICY: Healthcare providers/admins can view all service requests
-- This assumes you have a role-based system where healthcare providers have a specific role
CREATE POLICY "Healthcare providers can view all service requests" ON service_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (
                auth.users.raw_user_meta_data->>'role' = 'healthcare_provider'
                OR auth.users.raw_user_meta_data->>'role' = 'admin'
                OR auth.users.raw_user_meta_data->>'role' = 'nurse'
                OR auth.users.raw_user_meta_data->>'role' = 'doctor'
            )
        )
    );

-- 5. POLICY: Healthcare providers can update service requests (for processing)
CREATE POLICY "Healthcare providers can update service requests" ON service_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (
                auth.users.raw_user_meta_data->>'role' = 'healthcare_provider'
                OR auth.users.raw_user_meta_data->>'role' = 'admin'
                OR auth.users.raw_user_meta_data->>'role' = 'nurse'
                OR auth.users.raw_user_meta_data->>'role' = 'doctor'
            )
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (
                auth.users.raw_user_meta_data->>'role' = 'healthcare_provider'
                OR auth.users.raw_user_meta_data->>'role' = 'admin'
                OR auth.users.raw_user_meta_data->>'role' = 'nurse'
                OR auth.users.raw_user_meta_data->>'role' = 'doctor'
            )
        )
    );

-- 6. POLICY: System service account can perform all operations
-- This is useful for background jobs, data migration, etc.
CREATE POLICY "System service account full access" ON service_requests
    FOR ALL USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'service_account'
        )
    );

-- Alternative simpler policies if you don't have role-based system yet:
-- Uncomment these and comment out the role-based policies above

/*
-- SIMPLE POLICY: Users can only access their own service requests
CREATE POLICY "Users own service requests only" ON service_requests
    FOR ALL USING (auth.uid() = user_id);

-- SIMPLE POLICY: Allow service creation for authenticated users
CREATE POLICY "Authenticated users can create service requests" ON service_requests
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth.uid() = user_id
    );
*/

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON service_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Optional: Create an index for better performance on user_id queries
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at);

-- Verify the policies are working
-- You can test with these queries (replace with actual user IDs):

/*
-- Test as a regular user (should only see their own requests)
SELECT * FROM service_requests WHERE user_id = 'your-user-id-here';

-- Test policy by trying to access another user's request (should return empty)
SELECT * FROM service_requests WHERE user_id = 'different-user-id-here';
*/
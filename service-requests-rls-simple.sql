-- SIMPLE RLS Policies for service_requests table (Development/Testing)
-- NetLife Health Application
-- Use this for development or if you don't have role-based authentication yet

-- Enable RLS on the service_requests table
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can access their own service requests" ON service_requests;

-- SIMPLE POLICY: Users can only access their own service requests
-- This covers SELECT, INSERT, UPDATE, DELETE operations
CREATE POLICY "Users can access their own service requests" ON service_requests
    FOR ALL USING (
        auth.uid() = user_id
    ) WITH CHECK (
        auth.uid() = user_id
        AND auth.uid() IS NOT NULL
    );

-- Grant necessary permissions
GRANT ALL ON service_requests TO authenticated;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON service_requests(user_id);

-- Test the policy (uncomment to test)
/*
-- This should work (returns user's own requests)
SELECT * FROM service_requests WHERE user_id = auth.uid();

-- This should return empty (trying to access other user's requests)
SELECT * FROM service_requests WHERE user_id != auth.uid();
*/
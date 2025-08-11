-- ============================================================================
-- COMPREHENSIVE RLS POLICIES FOR DATA SYNCHRONIZATION SYSTEM
-- ============================================================================
-- This file contains all the Row Level Security policies needed for the
-- data synchronization system with comprehensive deletion capabilities

-- ============================================================================
-- SERVICE_REQUESTS TABLE POLICIES
-- ============================================================================

-- Enable RLS on service_requests table
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users can insert own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users can update own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users can delete own service requests" ON public.service_requests;

-- Create comprehensive policies for service_requests
CREATE POLICY "Users can view own service requests" ON public.service_requests
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service requests" ON public.service_requests
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service requests" ON public.service_requests
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own service requests" ON public.service_requests
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================================================
-- SCREENING_RESULTS TABLE POLICIES
-- ============================================================================

-- Enable RLS on screening_results table
ALTER TABLE public.screening_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own screening results" ON public.screening_results;
DROP POLICY IF EXISTS "Users can insert own screening results" ON public.screening_results;
DROP POLICY IF EXISTS "Users can update own screening results" ON public.screening_results;
DROP POLICY IF EXISTS "Users can delete own screening results" ON public.screening_results;

-- Create comprehensive policies for screening_results
CREATE POLICY "Users can view own screening results" ON public.screening_results
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own screening results" ON public.screening_results
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own screening results" ON public.screening_results
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own screening results" ON public.screening_results
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================================================
-- USER_SCREENING_ANSWERS TABLE POLICIES
-- ============================================================================

-- Enable RLS on user_screening_answers table
ALTER TABLE public.user_screening_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own screening answers" ON public.user_screening_answers;
DROP POLICY IF EXISTS "Users can insert own screening answers" ON public.user_screening_answers;
DROP POLICY IF EXISTS "Users can update own screening answers" ON public.user_screening_answers;
DROP POLICY IF EXISTS "Users can delete own screening answers" ON public.user_screening_answers;

-- Create comprehensive policies for user_screening_answers
CREATE POLICY "Users can view own screening answers" ON public.user_screening_answers
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own screening answers" ON public.user_screening_answers
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own screening answers" ON public.user_screening_answers
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own screening answers" ON public.user_screening_answers
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================================================
-- ADDITIONAL SECURITY ENHANCEMENTS
-- ============================================================================

-- Ensure proper foreign key constraints with CASCADE DELETE for data integrity
-- This ensures that when a user is deleted, all their related data is cleaned up

-- Update service_requests foreign key constraint (if not already set)
ALTER TABLE public.service_requests 
DROP CONSTRAINT IF EXISTS service_requests_user_id_fkey;

ALTER TABLE public.service_requests 
ADD CONSTRAINT service_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update screening_results foreign key constraint (if not already set)
ALTER TABLE public.screening_results 
DROP CONSTRAINT IF EXISTS screening_results_user_id_fkey;

ALTER TABLE public.screening_results 
ADD CONSTRAINT screening_results_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update user_screening_answers foreign key constraint (if not already set)
ALTER TABLE public.user_screening_answers 
DROP CONSTRAINT IF EXISTS user_screening_answers_user_id_fkey;

ALTER TABLE public.user_screening_answers 
ADD CONSTRAINT user_screening_answers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================================
-- PERFORMANCE INDEXES FOR DELETION OPERATIONS
-- ============================================================================

-- Indexes to optimize deletion queries
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id_delete 
ON public.service_requests(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_screening_results_user_id_delete 
ON public.screening_results(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_screening_answers_user_service_delete 
ON public.user_screening_answers(user_id, service_id) WHERE user_id IS NOT NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify the policies are working correctly

/*
-- Test queries to verify RLS policies (run as authenticated user):

-- Should return only current user's data
SELECT COUNT(*) FROM public.service_requests;
SELECT COUNT(*) FROM public.screening_results;
SELECT COUNT(*) FROM public.user_screening_answers;

-- Test deletion permissions (should work for own data only)
-- DELETE FROM public.service_requests WHERE id = 'your-request-id';
-- DELETE FROM public.screening_results WHERE id = 'your-result-id';
-- DELETE FROM public.user_screening_answers WHERE user_id = auth.uid() AND service_id = 'service-id';
*/

-- ============================================================================
-- NOTES FOR IMPLEMENTATION
-- ============================================================================

/*
IMPORTANT NOTES:

1. CASCADE DELETE: All foreign key constraints now use CASCADE DELETE to ensure
   data integrity when users are deleted from the system.

2. RLS SECURITY: All policies ensure users can only access, modify, and delete
   their own data using auth.uid() = user_id.

3. PERFORMANCE: Indexes are optimized for deletion operations to ensure fast
   cleanup of user data.

4. COMPREHENSIVE PERMISSIONS: All CRUD operations are covered with appropriate
   security policies.

5. TESTING: Always test these policies in a development environment first
   before applying to production.

6. BACKUP: Ensure you have a database backup before applying these changes.
*/
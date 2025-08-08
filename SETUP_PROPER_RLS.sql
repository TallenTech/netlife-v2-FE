-- Proper Row Level Security Setup for NetLife
-- This sets up secure RLS policies for authenticated users

-- ============================================================================
-- 1. SERVICE_REQUESTS TABLE RLS
-- ============================================================================

-- Re-enable RLS on service_requests table
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users can insert own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users can update own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Test user bypass policy" ON public.service_requests;
DROP POLICY IF EXISTS "Service account policy" ON public.service_requests;

-- Policy 1: Users can view their own service requests
CREATE POLICY "Users can view own service requests" ON public.service_requests
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own service requests
CREATE POLICY "Users can insert own service requests" ON public.service_requests
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own service requests (optional - for status updates)
CREATE POLICY "Users can update own service requests" ON public.service_requests
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 2. USER_SCREENING_ANSWERS TABLE RLS
-- ============================================================================

-- Re-enable RLS on user_screening_answers table
ALTER TABLE public.user_screening_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own screening answers" ON public.user_screening_answers;
DROP POLICY IF EXISTS "Users can insert own screening answers" ON public.user_screening_answers;
DROP POLICY IF EXISTS "Users can update own screening answers" ON public.user_screening_answers;

-- Policy 1: Users can view their own screening answers
CREATE POLICY "Users can view own screening answers" ON public.user_screening_answers
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own screening answers
CREATE POLICY "Users can insert own screening answers" ON public.user_screening_answers
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own screening answers (if needed)
CREATE POLICY "Users can update own screening answers" ON public.user_screening_answers
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. PROFILES TABLE RLS (if not already set up)
-- ============================================================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Users can insert their own profile (for registration)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 4. PUBLIC TABLES (No RLS needed - everyone can read)
-- ============================================================================

-- These tables should be readable by all authenticated users
-- No RLS needed, but ensure they're accessible

-- Services table - everyone can read services
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;

-- Service questions - everyone can read questions
ALTER TABLE public.service_questions DISABLE ROW LEVEL SECURITY;

-- Question options - everyone can read options
ALTER TABLE public.question_options DISABLE ROW LEVEL SECURITY;

-- Districts and sub_counties - everyone can read locations
ALTER TABLE public.districts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_counties DISABLE ROW LEVEL SECURITY;

-- Videos - everyone can read videos (or add RLS if you want user-specific videos)
ALTER TABLE public.videos DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. STORAGE BUCKET POLICIES (for file attachments)
-- ============================================================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public can view attachments" ON storage.objects;

-- Policy 1: Users can upload files to their own folder
CREATE POLICY "Users can upload their own attachments" ON storage.objects
    FOR INSERT 
    WITH CHECK (
        bucket_id = 'attachments' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy 2: Users can view their own uploaded files
CREATE POLICY "Users can view their own attachments" ON storage.objects
    FOR SELECT 
    USING (
        bucket_id = 'attachments' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy 3: Users can delete their own files
CREATE POLICY "Users can delete their own attachments" ON storage.objects
    FOR DELETE 
    USING (
        bucket_id = 'attachments' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================================================
-- 6. ADMIN POLICIES (Optional - for healthcare providers/admins)
-- ============================================================================

-- If you want to add admin access later, you can create policies like:
-- 
-- CREATE POLICY "Admins can view all service requests" ON public.service_requests
--     FOR SELECT 
--     USING (
--         EXISTS (
--             SELECT 1 FROM public.profiles 
--             WHERE id = auth.uid() 
--             AND role = 'admin'
--         )
--     );

-- ============================================================================
-- 7. VERIFY RLS STATUS
-- ============================================================================

-- Check which tables have RLS enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ Enabled'
        ELSE '❌ Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'service_requests', 
    'user_screening_answers', 
    'profiles',
    'services',
    'service_questions',
    'question_options'
)
ORDER BY tablename;

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- 
-- ✅ PROTECTED TABLES (RLS Enabled):
-- - service_requests: Users can only access their own requests
-- - user_screening_answers: Users can only access their own answers  
-- - profiles: Users can only access their own profile
--
-- ✅ PUBLIC TABLES (RLS Disabled):
-- - services: Everyone can read available services
-- - service_questions: Everyone can read questions
-- - question_options: Everyone can read answer options
-- - districts, sub_counties: Everyone can read location data
-- - videos: Everyone can read videos
--
-- ✅ STORAGE:
-- - Users can only upload/view/delete files in their own folders
--
-- This setup ensures:
-- 1. Data privacy - users only see their own data
-- 2. Security - no unauthorized access
-- 3. Functionality - public data is accessible to all
-- 4. Scalability - ready for multi-user production use
-- ============================================================================
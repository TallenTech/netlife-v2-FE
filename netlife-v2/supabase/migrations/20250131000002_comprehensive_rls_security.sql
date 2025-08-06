-- Comprehensive RLS security setup for WhatsApp authentication system
-- Ensures all tables have proper Row Level Security policies

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Profiles table policies
-- Policy 1: Service role can manage all profiles (for Edge Functions)
CREATE POLICY "Service role can manage all profiles" 
ON public.profiles 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Policy 2: Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Policy 4: Users can insert their own profile (during registration)
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Add security functions for phone number validation
CREATE OR REPLACE FUNCTION public.is_valid_phone_format(phone_number text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Basic phone number validation (international format)
  RETURN phone_number ~ '^\+[1-9]\d{6,14}$';
END;
$$;

-- Add function to check if user owns phone number
CREATE OR REPLACE FUNCTION public.user_owns_phone(phone_number text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.whatsapp_number = phone_number
  );
END;
$$;

-- Add helpful comments
COMMENT ON TABLE public.profiles IS 'User profiles with phone number verification. Protected by RLS.';
COMMENT ON FUNCTION public.is_valid_phone_format(text) IS 'Validates phone number format at database level';
COMMENT ON FUNCTION public.user_owns_phone(text) IS 'Checks if authenticated user owns the phone number';

-- Create indexes for better performance with RLS
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_lookup ON public.profiles(whatsapp_number) WHERE whatsapp_number IS NOT NULL;

-- Verify RLS is enabled on both tables
DO $$
BEGIN
  -- Check login_codes table
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'login_codes') THEN
    RAISE EXCEPTION 'RLS was not enabled on login_codes table';
  END IF;
  
  -- Check profiles table
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles') THEN
    RAISE EXCEPTION 'RLS was not enabled on profiles table';
  END IF;
  
  RAISE NOTICE 'RLS successfully enabled on all authentication tables';
END $$;
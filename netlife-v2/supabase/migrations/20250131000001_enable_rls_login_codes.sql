-- Enable Row Level Security (RLS) for login_codes table
-- This ensures that users can only access their own OTP codes

-- Enable RLS on login_codes table
ALTER TABLE public.login_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can only access their own login codes" ON public.login_codes;
DROP POLICY IF EXISTS "Service role can manage all login codes" ON public.login_codes;
DROP POLICY IF EXISTS "Authenticated users can insert their own login codes" ON public.login_codes;
DROP POLICY IF EXISTS "Users can update their own login codes" ON public.login_codes;
DROP POLICY IF EXISTS "Users can delete their own login codes" ON public.login_codes;

-- Policy 1: Service role (Edge Functions) can manage all login codes
-- This allows our Edge Functions to create, read, update, and delete OTP codes
CREATE POLICY "Service role can manage all login codes" 
ON public.login_codes 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Policy 2: Authenticated users can only read their own login codes
-- This allows users to check if they have an active OTP (if needed by frontend)
CREATE POLICY "Users can only read their own login codes" 
ON public.login_codes 
FOR SELECT 
TO authenticated 
USING (
  phone_number = (
    SELECT whatsapp_number 
    FROM public.profiles 
    WHERE profiles.id = auth.uid()
  )
);

-- Policy 3: No direct insert/update/delete for regular users
-- All OTP operations should go through Edge Functions for security
-- (No additional policies needed - service_role handles all operations)

-- Add helpful comments
COMMENT ON TABLE public.login_codes IS 'Stores OTP codes for phone number verification. Protected by RLS.';
COMMENT ON POLICY "Service role can manage all login codes" ON public.login_codes IS 'Allows Edge Functions to manage OTP codes securely';
COMMENT ON POLICY "Users can only read their own login codes" ON public.login_codes IS 'Users can check their own OTP status if needed';

-- Verify RLS is enabled
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'login_codes') THEN
    RAISE EXCEPTION 'RLS was not enabled on login_codes table';
  END IF;
  RAISE NOTICE 'RLS successfully enabled on login_codes table';
END $$;
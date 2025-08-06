import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { validatePhoneNumber } from "../utils/phone.ts";
import { OTPDatabaseService } from "../utils/database.ts";

interface VerifyCodeRequest {
    phone: string;
    code: string;
}

interface VerifyCodeResponse {
    success: boolean;
    message: string;
    user?: any;
    session?: any;
    error?: string;
}

serve(async (req: Request): Promise<Response> => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Only allow POST requests
        if (req.method !== 'POST') {
            return new Response(
                JSON.stringify({ success: false, error: 'Method not allowed' }),
                {
                    status: 405,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // Parse request body
        const { phone, code }: VerifyCodeRequest = await req.json();

        if (!phone || !code) {
            return new Response(
                JSON.stringify({ success: false, error: 'Phone number and code are required' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // Validate phone number format
        const phoneValidation = validatePhoneNumber(phone);
        if (!phoneValidation.isValid) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: phoneValidation.error || 'Invalid phone number format'
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        const normalizedPhone = phoneValidation.normalized!;

        // Initialize database service
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        const dbService = new OTPDatabaseService({
            supabaseUrl,
            supabaseServiceKey
        });

        // Get stored OTP
        const storedOTP = await dbService.getOTP(normalizedPhone);
        if (!storedOTP) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'No OTP code found for this phone number. Please request a new code.'
                }),
                {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // Check if OTP has expired
        const now = new Date();
        const expiresAt = new Date(storedOTP.expires_at);
        if (now > expiresAt) {
            // Clean up expired OTP
            await dbService.deleteOTP(normalizedPhone);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'OTP code has expired. Please request a new code.'
                }),
                {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // Verify the code
        if (storedOTP.code !== code) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Invalid OTP code. Please check and try again.'
                }),
                {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // Mark OTP as verified
        await dbService.markAsVerified(normalizedPhone);

        // Initialize Supabase client for auth operations
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Create or get user in Supabase Auth
        let authUser;
        let session;
        let userProfile;

        try {
            // First, try to create or get the user
            const { data: userData, error: userError } = await supabase.auth.admin.createUser({
                email: `${normalizedPhone.replace('+', '')}@temp.netlife.com`,
                phone: normalizedPhone,
                user_metadata: {
                    phone: normalizedPhone,
                    verified_phone: true
                },
                email_confirm: true,
                phone_confirm: true
            });

            if (userError && userError.message !== 'User already registered') {
                console.error('Error creating user:', userError);
                throw userError;
            }

            authUser = userData?.user;

            // If user creation was successful or user already exists, generate a session
            if (authUser) {
                const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
                    type: 'magiclink',
                    email: authUser.email!,
                    options: {
                        data: {
                            phone: normalizedPhone,
                            verified_phone: true
                        }
                    }
                });

                if (sessionError) {
                    console.error('Error generating session:', sessionError);
                } else {
                    // Extract session info from the generated link
                    session = sessionData;
                }

                // Create or update user profile with WhatsApp number
                console.log(`Creating/updating profile for user: ${authUser.id}`);

                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: authUser.id,
                        whatsapp_number: normalizedPhone,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'id'
                    })
                    .select()
                    .single();

                if (profileError) {
                    console.error('Error creating/updating profile:', profileError);
                    // Don't throw error - auth was successful, profile creation is secondary
                } else {
                    userProfile = profileData;
                    console.log('Profile created/updated successfully:', profileData);
                }
            }

        } catch (authError) {
            console.error('Authentication error:', authError);
            // Continue without auth for now - just return success
        }

        console.log(`OTP verified successfully for ${normalizedPhone}`);

        const response: VerifyCodeResponse = {
            success: true,
            message: 'OTP code verified successfully',
            ...(authUser && { user: authUser }),
            ...(session && { session: session }),
            ...(userProfile && { profile: userProfile })
        };

        return new Response(
            JSON.stringify(response),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Error in verify-code function:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Internal server error'
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface CompleteProfileRequest {
  username?: string;
  full_name: string;
  date_of_birth?: string; // YYYY-MM-DD format
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  district?: string;
  sub_county?: string;
  preferred_language?: 'en' | 'es' | 'sw'; // English, Spanish, Swahili
  profile_picture?: string; // Profile picture URL or avatar identifier
}

interface CompleteProfileResponse {
  success: boolean;
  message: string;
  profile?: any;
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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client with the user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired session' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const profileData: CompleteProfileRequest = await req.json();

    // Validate required fields
    if (!profileData.full_name || profileData.full_name.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Full name is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate full name format (basic validation)
    if (profileData.full_name.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'Full name must be at least 2 characters long' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate date of birth if provided
    if (profileData.date_of_birth) {
      const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dobRegex.test(profileData.date_of_birth)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Date of birth must be in YYYY-MM-DD format' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Check if date is reasonable (not in future, not too old)
      const dob = new Date(profileData.date_of_birth);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();

      if (dob > now) {
        return new Response(
          JSON.stringify({ success: false, error: 'Date of birth cannot be in the future' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (age > 120) {
        return new Response(
          JSON.stringify({ success: false, error: 'Please enter a valid date of birth' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Validate gender if provided
    if (profileData.gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(profileData.gender)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid gender value' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate preferred language if provided
    if (profileData.preferred_language && !['en', 'es', 'sw'].includes(profileData.preferred_language)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid preferred language' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate username if provided
    if (profileData.username) {
      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
      if (!usernameRegex.test(profileData.username)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Username must be 3-30 characters long and contain only letters, numbers, underscore, or hyphen' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Validate profile picture if provided (can be URL or avatar identifier)
    if (profileData.profile_picture) {
      // If it looks like a URL, validate URL format
      if (profileData.profile_picture.startsWith('http')) {
        try {
          new URL(profileData.profile_picture);
        } catch {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid profile picture URL format' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }
      // Otherwise, assume it's an avatar identifier (no validation needed)
    }

    // Prepare profile update data
    const updateData = {
      username: profileData.username?.trim() || null,
      full_name: profileData.full_name.trim(),
      date_of_birth: profileData.date_of_birth || null,
      gender: profileData.gender || null,
      district: profileData.district?.trim() || null,
      sub_county: profileData.sub_county?.trim() || null,
      preferred_language: profileData.preferred_language || 'en',
      profile_picture: profileData.profile_picture || null,
      updated_at: new Date().toISOString()
    };

    // Update the user's profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update profile. Please try again.'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Profile completed successfully for user ${user.id}`);

    const response: CompleteProfileResponse = {
      success: true,
      message: 'Profile completed successfully',
      profile: updatedProfile
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in complete-profile function:', error);

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
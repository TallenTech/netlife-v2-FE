// Supabase Edge Function to delete user account
// Deploy this to Supabase Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create Supabase client with service role key (has admin privileges)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Get the authorization header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('No authorization header')
        }

        // Verify the user's JWT token
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) {
            throw new Error('Invalid token')
        }

        const userId = user.id

        // Delete all user data from custom tables
        const tablesToClean = [
            'user_survey_completions',
            'service_requests',
            'notifications',
            'user_settings',
            'profiles'
        ]

        const deletionResults = {}

        for (const table of tablesToClean) {
            try {
                const column = table === 'profiles' ? 'id' : 'user_id'
                const { error, count } = await supabaseAdmin
                    .from(table)
                    .delete({ count: 'exact' })
                    .eq(column, userId)

                deletionResults[table] = error ? `Error: ${error.message}` : `${count || 0} records deleted`
            } catch (tableError) {
                deletionResults[table] = `Error: ${tableError.message}`
            }
        }

        // Delete the auth user (this requires admin privileges)
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteUserError) {
            deletionResults.auth_user = `Error: ${deleteUserError.message}`
        } else {
            deletionResults.auth_user = 'Successfully deleted'
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Account deletion completed',
                results: deletionResults
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )

    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
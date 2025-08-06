import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface GetAvatarsResponse {
    success: boolean;
    message: string;
    avatars?: any[];
    error?: string;
}

serve(async (req: Request): Promise<Response> => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Only allow GET requests
        if (req.method !== 'GET') {
            return new Response(
                JSON.stringify({ success: false, error: 'Method not allowed' }),
                {
                    status: 405,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Get query parameters for filtering
        const url = new URL(req.url);
        const category = url.searchParams.get('category');
        const isActive = url.searchParams.get('active');

        // Build query
        let query = supabase
            .from('avatars')
            .select('*')
            .order('category', { ascending: true })
            .order('name', { ascending: true });

        // Apply filters if provided
        if (category) {
            query = query.eq('category', category);
        }

        if (isActive !== null) {
            query = query.eq('is_active', isActive === 'true');
        } else {
            // Default to active avatars only
            query = query.eq('is_active', true);
        }

        const { data: avatars, error: fetchError } = await query;

        if (fetchError) {
            console.error('Error fetching avatars:', fetchError);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Failed to fetch avatars'
                }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // Group avatars by category for easier frontend handling
        const groupedAvatars = avatars.reduce((acc: any, avatar: any) => {
            const category = avatar.category || 'general';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(avatar);
            return acc;
        }, {});

        const response: GetAvatarsResponse = {
            success: true,
            message: 'Avatars fetched successfully',
            avatars: {
                all: avatars,
                grouped: groupedAvatars,
                categories: Object.keys(groupedAvatars)
            }
        };

        return new Response(
            JSON.stringify(response),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Error in get-avatars function:', error);

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
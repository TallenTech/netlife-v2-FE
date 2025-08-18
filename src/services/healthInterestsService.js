import { supabase } from '@/lib/supabase';

// Format response helper
const formatSuccess = (data) => ({ success: true, data });
const formatError = (error, message = "An error occurred") => ({
    success: false,
    error: error?.message || message
});

/**
 * Get all available health interests from database
 */
async function getAvailableHealthInterests() {
    try {
        const { data, error } = await supabase
            .rpc('get_available_health_interests');

        if (error) throw error;
        return formatSuccess(data);
    } catch (error) {
        return formatError(error, "Failed to fetch health interests.");
    }
}

/**
 * Get user's current health interests
 */
async function getUserHealthInterests(userId) {
    try {
        // First try to get from profiles table (simple array)
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('health_interests')
            .eq('id', userId)
            .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;

        // Also get detailed interests from user_health_interests table
        const { data: detailedData, error: detailedError } = await supabase
            .rpc('get_user_health_interests', { user_uuid: userId });

        if (detailedError && detailedError.code !== 'PGRST116') throw detailedError;

        return formatSuccess({
            simple: profileData?.health_interests || [],
            detailed: detailedData || []
        });
    } catch (error) {
        return formatError(error, "Failed to fetch user health interests.");
    }
}

/**
 * Update user's health interests
 */
async function updateUserHealthInterests(userId, interests) {
    try {
        // Update using the database function
        const { data, error } = await supabase
            .rpc('update_user_health_interests', {
                user_uuid: userId,
                interest_names: interests
            });

        if (error) throw error;

        if (!data) {
            throw new Error("Failed to update health interests");
        }

        return formatSuccess({ message: "Health interests updated successfully" });
    } catch (error) {
        return formatError(error, "Failed to update health interests.");
    }
}

export const healthInterestsService = {
    getAvailableHealthInterests,
    getUserHealthInterests,
    updateUserHealthInterests
};

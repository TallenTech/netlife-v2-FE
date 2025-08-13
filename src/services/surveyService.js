import { supabase } from '@/lib/supabase';

export const surveyService = {
    /**
     * Get the survey status for a user
     * @param {string} userId - The user ID to check survey status for
     * @returns {Promise<{status: string, lastCompletedAt: string|null, nextAvailableAt: string|null, canTakeSurvey: boolean}>}
     */
    async getSurveyStatus(userId) {
        try {
            // Get the most recent completed survey
            const { data: completedSurveys, error } = await supabase
                .from('user_survey_completions')
                .select('completed_at')
                .eq('user_id', userId)
                .eq('status', 'completed')
                .order('completed_at', { ascending: false })
                .limit(1);

            if (error) {
                console.error('Error fetching survey status:', error);
                return {
                    status: 'available',
                    lastCompletedAt: null,
                    nextAvailableAt: null,
                    canTakeSurvey: true
                };
            }

            // If no completed surveys, survey is available
            if (!completedSurveys || completedSurveys.length === 0) {
                return {
                    status: 'available',
                    lastCompletedAt: null,
                    nextAvailableAt: null,
                    canTakeSurvey: true
                };
            }

            const lastCompletedAt = new Date(completedSurveys[0].completed_at);
            const now = new Date();
            const threeMonthsInMs = 3 * 30 * 24 * 60 * 60 * 1000; // 3 months
            const nextAvailableAt = new Date(lastCompletedAt.getTime() + threeMonthsInMs);

            const canTakeSurvey = now >= nextAvailableAt;

            return {
                status: canTakeSurvey ? 'available' : 'completed',
                lastCompletedAt: lastCompletedAt.toISOString(),
                nextAvailableAt: nextAvailableAt.toISOString(),
                canTakeSurvey
            };
        } catch (error) {
            console.error('Error in getSurveyStatus:', error);
            return {
                status: 'available',
                lastCompletedAt: null,
                nextAvailableAt: null,
                canTakeSurvey: true
            };
        }
    },

    /**
     * Get a human-readable message for when the next survey is available
     * @param {string} nextAvailableAt - ISO string of next available date
     * @returns {string} Human readable message
     */
    getNextAvailableMessage(nextAvailableAt) {
        if (!nextAvailableAt) return 'Come back after 3 months';

        const nextDate = new Date(nextAvailableAt);
        const now = new Date();
        const diffInMs = nextDate.getTime() - now.getTime();
        const diffInSeconds = Math.ceil(diffInMs / 1000);
        const diffInMinutes = Math.ceil(diffInMs / (1000 * 60));
        const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMs <= 0) {
            return 'A new survey is available';
        } else if (diffInSeconds < 60) {
            return `Available in ${diffInSeconds} second${diffInSeconds === 1 ? '' : 's'}`;
        } else if (diffInMinutes < 60) {
            return `Available in ${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'}`;
        } else if (diffInDays <= 7) {
            return `Available in ${diffInDays} day${diffInDays === 1 ? '' : 's'}`;
        } else if (diffInDays <= 30) {
            const weeks = Math.ceil(diffInDays / 7);
            return `Available in ${weeks} week${weeks === 1 ? '' : 's'}`;
        } else {
            const months = Math.ceil(diffInDays / 30);
            return `Available in ${months} month${months === 1 ? '' : 's'}`;
        }
    }
};
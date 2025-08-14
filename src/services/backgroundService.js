import { settingsService } from './settingsService';
import { supabase } from '@/lib/supabase';

export const backgroundService = {
    /**
     * Initialize background services
     */
    init() {
        // Run cleanup on app start
        this.runPeriodicCleanup();

        // Set up periodic cleanup (every 24 hours)
        setInterval(() => {
            this.runPeriodicCleanup();
        }, 24 * 60 * 60 * 1000); // 24 hours
    },

    /**
     * Run periodic cleanup for all users based on their settings
     */
    async runPeriodicCleanup() {
        try {
            console.log('Running periodic data cleanup...');

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Load user settings
            const settings = await settingsService.loadSettings(user.id);

            // Run auto-delete if enabled
            if (settings.autoDelete !== 'never') {
                const result = await settingsService.autoDeleteSurveyResponses(user.id, settings);
                if (result.success) {
                    console.log('Periodic cleanup completed:', result.message);
                } else {
                    console.error('Periodic cleanup failed:', result.error);
                }
            }
        } catch (error) {
            console.error('Error in periodic cleanup:', error);
        }
    },

    /**
     * Run cleanup for a specific user
     * @param {string} userId - User ID
     */
    async runUserCleanup(userId) {
        try {
            const settings = await settingsService.loadSettings(userId);

            if (settings.autoDelete !== 'never') {
                return await settingsService.autoDeleteSurveyResponses(userId, settings);
            }

            return { success: true, message: 'Auto-delete disabled' };
        } catch (error) {
            console.error('Error in user cleanup:', error);
            return { success: false, error: error.message };
        }
    }
};
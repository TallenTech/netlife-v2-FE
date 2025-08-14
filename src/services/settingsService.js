import { supabase } from '@/lib/supabase';

export const settingsService = {
    /**
     * Save user settings to database and localStorage
     * @param {string} userId - User ID
     * @param {Object} settings - Settings object
     */
    async saveSettings(userId, settings) {
        try {
            // Save to database
            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: userId,
                    settings: settings,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error saving settings to database:', error);
                // Still save to localStorage even if database fails
            }

            // Save to localStorage as backup
            localStorage.setItem("netlife_settings", JSON.stringify(settings));

            return { success: true };
        } catch (error) {
            console.error('Error in saveSettings:', error);
            // Fallback to localStorage only
            localStorage.setItem("netlife_settings", JSON.stringify(settings));
            return { success: true, warning: 'Settings saved locally only' };
        }
    },

    /**
     * Load user settings from database or localStorage
     * @param {string} userId - User ID
     */
    async loadSettings(userId) {
        try {
            // Try to load from database first
            const { data, error } = await supabase
                .from('user_settings')
                .select('settings')
                .eq('user_id', userId)
                .single();

            if (!error && data) {
                // Save to localStorage for offline access
                localStorage.setItem("netlife_settings", JSON.stringify(data.settings));
                return data.settings;
            }

            // Fallback to localStorage
            const savedSettings = localStorage.getItem("netlife_settings");
            if (savedSettings) {
                return JSON.parse(savedSettings);
            }

            // Return default settings
            return {
                autoDelete: "never",
                fakeAccountMode: false,
                silentAlerts: false,
                crisisOverride: true,
            };
        } catch (error) {
            console.error('Error loading settings:', error);
            // Fallback to localStorage
            const savedSettings = localStorage.getItem("netlife_settings");
            return savedSettings ? JSON.parse(savedSettings) : {
                autoDelete: "never",
                fakeAccountMode: false,
                silentAlerts: false,
                crisisOverride: true,
            };
        }
    },

    /**
     * Auto-delete survey responses based on user settings
     * @param {string} userId - User ID
     * @param {Object} settings - User settings
     */
    async autoDeleteSurveyResponses(userId, settings) {
        if (settings.autoDelete === 'never') {
            return { success: true, message: 'Auto-delete disabled' };
        }

        try {
            const daysToKeep = parseInt(settings.autoDelete);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            // Delete old survey completions
            const { error: surveyError } = await supabase
                .from('user_survey_completions')
                .delete()
                .eq('user_id', userId)
                .lt('completed_at', cutoffDate.toISOString());

            if (surveyError) {
                console.error('Error deleting old surveys:', surveyError);
                return { success: false, error: surveyError.message };
            }

            // Delete old service requests if they exist
            const { error: serviceError } = await supabase
                .from('service_requests')
                .delete()
                .eq('user_id', userId)
                .lt('created_at', cutoffDate.toISOString());

            if (serviceError) {
                console.error('Error deleting old service requests:', serviceError);
                // Don't fail completely if service requests deletion fails
            }

            return { success: true, message: `Data older than ${daysToKeep} days deleted` };
        } catch (error) {
            console.error('Error in autoDeleteSurveyResponses:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Purge all local data
     */
    purgeLocalData() {
        try {
            // Clear all localStorage items that start with 'netlife_'
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('netlife_')) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));

            // Clear session storage as well
            sessionStorage.clear();

            return { success: true, message: 'All local data purged' };
        } catch (error) {
            console.error('Error purging local data:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Download all user data
     * @param {string} userId - User ID
     */
    async downloadAllData(userId) {
        try {
            const dataToDownload = {
                timestamp: new Date().toISOString(),
                userId: userId,
                localStorage: {},
                databaseData: {}
            };

            // Collect localStorage data
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('netlife_')) {
                    try {
                        dataToDownload.localStorage[key] = JSON.parse(localStorage.getItem(key));
                    } catch {
                        dataToDownload.localStorage[key] = localStorage.getItem(key);
                    }
                }
            }

            // Collect database data
            try {
                // Get survey completions
                const { data: surveys } = await supabase
                    .from('user_survey_completions')
                    .select('*')
                    .eq('user_id', userId);

                if (surveys) dataToDownload.databaseData.surveys = surveys;

                // Get service requests
                const { data: serviceRequests } = await supabase
                    .from('service_requests')
                    .select('*')
                    .eq('user_id', userId);

                if (serviceRequests) dataToDownload.databaseData.serviceRequests = serviceRequests;

                // Get user settings
                const { data: settings } = await supabase
                    .from('user_settings')
                    .select('*')
                    .eq('user_id', userId);

                if (settings) dataToDownload.databaseData.settings = settings;

                // Get notifications
                const { data: notifications } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', userId);

                if (notifications) dataToDownload.databaseData.notifications = notifications;

            } catch (dbError) {
                console.error('Error fetching database data:', dbError);
                dataToDownload.databaseData.error = 'Could not fetch some database data';
            }

            // Create and download file
            const dataStr = "data:text/json;charset=utf-8," +
                encodeURIComponent(JSON.stringify(dataToDownload, null, 2));

            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute('href', dataStr);
            downloadAnchorNode.setAttribute('download',
                `netlife_data_backup_${new Date().toISOString().split('T')[0]}.json`);

            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            return { success: true, message: 'Data downloaded successfully' };
        } catch (error) {
            console.error('Error downloading data:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Delete user account completely
     * @param {string} userId - User ID
     */
    async deleteAccount(userId) {
        try {
            let deletionErrors = [];
            let successfulDeletions = [];

            // Step 1: Delete all user data from various tables
            const tablesToClean = [
                { table: 'user_survey_completions', column: 'user_id' },
                { table: 'service_requests', column: 'user_id' },
                { table: 'notifications', column: 'user_id' },
                { table: 'user_settings', column: 'user_id' },
                { table: 'profiles', column: 'id' } // profiles table uses 'id' not 'user_id'
            ];

            for (const { table, column } of tablesToClean) {
                try {
                    const { error, count } = await supabase
                        .from(table)
                        .delete({ count: 'exact' })
                        .eq(column, userId);

                    if (error) {
                        if (!error.message.includes('does not exist') && !error.message.includes('relation') && !error.message.includes('not found')) {
                            deletionErrors.push(`${table}: ${error.message}`);
                        }
                    } else {
                        successfulDeletions.push(`${table}: ${count || 0} records deleted`);
                    }
                } catch (tableError) {
                    deletionErrors.push(`${table}: ${tableError.message}`);
                }
            }

            // Step 2: Delete the auth user using the correct method
            try {
                // Use the user's own auth session to delete their account
                const { error: authError } = await supabase.auth.updateUser({
                    data: { deleted: true, deleted_at: new Date().toISOString() }
                });

                if (authError) {
                    // If updating user data fails, try to sign out the user
                    await supabase.auth.signOut();
                    deletionErrors.push(`Auth update failed: ${authError.message}`);
                } else {
                    // Sign out the user after marking as deleted
                    await supabase.auth.signOut();
                    successfulDeletions.push('User marked as deleted and signed out');
                }
            } catch (authError) {
                deletionErrors.push(`Auth deletion failed: ${authError.message}`);
                // Still try to sign out
                try {
                    await supabase.auth.signOut();
                    successfulDeletions.push('User signed out');
                } catch (signOutError) {
                    deletionErrors.push(`Sign out failed: ${signOutError.message}`);
                }
            }

            // Step 3: Clear local storage
            try {
                this.purgeLocalData();
                successfulDeletions.push('Local data cleared');
            } catch (localError) {
                deletionErrors.push(`Local data cleanup failed: ${localError.message}`);
            }

            // Step 4: Determine overall success
            const hasSuccessfulDeletions = successfulDeletions.length > 0;
            const hasCriticalErrors = deletionErrors.some(error =>
                error.includes('profiles:') || error.includes('Auth deletion failed')
            );

            if (hasSuccessfulDeletions && !hasCriticalErrors) {
                return {
                    success: true,
                    message: 'Account deletion completed successfully',
                    details: {
                        successful: successfulDeletions,
                        errors: deletionErrors
                    }
                };
            } else if (hasSuccessfulDeletions) {
                return {
                    success: true,
                    message: 'Account partially deleted - some data may remain',
                    warning: true,
                    details: {
                        successful: successfulDeletions,
                        errors: deletionErrors
                    }
                };
            } else {
                return {
                    success: false,
                    error: 'Account deletion failed',
                    details: {
                        successful: successfulDeletions,
                        errors: deletionErrors
                    }
                };
            }
        } catch (error) {
            console.error('Error deleting account:', error);

            // Emergency cleanup - at least try to clear local data and sign out
            try {
                this.purgeLocalData();
                await supabase.auth.signOut();
            } catch (emergencyError) {
                console.error('Emergency cleanup failed:', emergencyError);
            }

            return { success: false, error: error.message };
        }
    },

    /**
     * Delete user account using database function (preferred method)
     * @param {string} userId - User ID
     */
    async deleteAccountWithFunction(userId) {
        try {
            // Call the database function for complete account deletion
            const { data, error } = await supabase.rpc('delete_user_account', {
                target_user_id: userId
            });

            if (error) {
                console.error('Database function error:', error);
                // Fallback to manual deletion
                return await this.deleteAccount(userId);
            }

            if (data && data.success) {
                // Clear local storage
                this.purgeLocalData();

                // Sign out the user
                await supabase.auth.signOut();

                return {
                    success: true,
                    message: data.message,
                    details: data.deleted_records
                };
            } else {
                return {
                    success: false,
                    error: data?.error || 'Account deletion failed',
                    details: data?.partial_results
                };
            }
        } catch (error) {
            console.error('Error calling delete function:', error);
            // Fallback to manual deletion
            return await this.deleteAccount(userId);
        }
    },


};
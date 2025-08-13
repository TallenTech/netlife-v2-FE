import { supabase } from '@/lib/supabase';

/**
 * Notification Service
 * Handles fetching and managing user notifications
 * Note: Most notifications are now created automatically via database triggers
 */
export const notificationService = {
    /**
     * Create a manual notification for a user (for cases not covered by triggers)
     * @param {string} userId - User ID to send notification to
     * @param {string} type - Notification type
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {object} data - Additional notification data
     */
    async createNotification(userId, type, title, message, data = {}) {
        try {
            const { data: result, error } = await supabase
                .from('notifications')
                .insert([{
                    user_id: userId,
                    type,
                    title,
                    message,
                    read: false,
                    data: data
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data: result };
        } catch (error) {
            console.error('Error creating notification:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Create notifications for all users (broadcast) - for manual notifications only
     * Most broadcast notifications (like new videos) are handled by database triggers
     * @param {string} type - Notification type
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {object} data - Additional notification data
     */
    async createBroadcastNotification(type, title, message, data = {}) {
        try {
            // Get all user IDs from auth.users (since triggers use this table)
            const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

            if (usersError) throw usersError;

            // Create notifications for all users
            const notifications = users.users.map(user => ({
                user_id: user.id,
                type,
                title,
                message,
                read: false,
                data
            }));

            const { data: result, error } = await supabase
                .from('notifications')
                .insert(notifications)
                .select();

            if (error) throw error;
            return { success: true, data: result };
        } catch (error) {
            console.error('Error creating broadcast notification:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get notifications for a user
     * @param {string} userId - User ID
     * @param {number} limit - Number of notifications to fetch
     * @param {boolean} unreadOnly - Fetch only unread notifications
     * @param {string} type - Filter by notification type (optional)
     */
    async getUserNotifications(userId, limit = 50, unreadOnly = false, type = null) {
        try {
            let query = supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (unreadOnly) {
                query = query.eq('read', false);
            }

            if (type) {
                query = query.eq('type', type);
            }

            if (limit) {
                query = query.limit(limit);
            }

            const { data, error } = await query;
            if (error) throw error;

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get unread notification count for a user
     * @param {string} userId - User ID
     * @param {string} type - Filter by notification type (optional)
     */
    async getUnreadCount(userId, type = null) {
        try {
            let query = supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('read', false);

            if (type) {
                query = query.eq('type', type);
            }

            const { count, error } = await query;
            if (error) throw error;
            return { success: true, count: count || 0 };
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Mark notification as read
     * @param {string} notificationId - Notification ID
     */
    async markAsRead(notificationId) {
        try {
            // First, get the current user to ensure RLS works properly
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId)
                .eq('user_id', user.id) // Ensure user can only update their own notifications
                .select();

            if (error) throw error;

            // Check if any rows were updated
            if (!data || data.length === 0) {
                throw new Error('Notification not found or access denied');
            }

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Mark all notifications as read for a user
     * @param {string} userId - User ID
     * @param {string} type - Filter by notification type (optional)
     */
    async markAllAsRead(userId, type = null) {
        try {
            let query = supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', userId)
                .eq('read', false);

            if (type) {
                query = query.eq('type', type);
            }

            const { data, error } = await query.select();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Delete a notification
     * @param {string} notificationId - Notification ID
     */
    async deleteNotification(notificationId) {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting notification:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Subscribe to real-time notification updates
     * @param {string} userId - User ID
     * @param {function} callback - Callback function for updates
     */
    subscribeToNotifications(userId, callback) {
        const subscription = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                callback
            )
            .subscribe();

        return subscription;
    },

    /**
     * Unsubscribe from real-time updates
     * @param {object} subscription - Subscription object
     */
    unsubscribeFromNotifications(subscription) {
        if (subscription) {
            supabase.removeChannel(subscription);
        }
    }
};

/**
 * Notification Type Constants
 * These match the types used in database triggers
 */
export const NOTIFICATION_TYPES = {
    SERVICE_REQUEST: 'service_request',
    SERVICE_REQUEST_STATUS: 'service_request_status',
    SCREENING_RESULT: 'screening_result',
    VIDEO: 'video',
    MANUAL: 'manual' // For manually created notifications
};

/**
 * Helper functions for manual notifications (not covered by triggers)
 * Most notifications are now created automatically via database triggers
 */

/**
 * Create a manual notification (for cases not covered by triggers)
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional data
 */
export const createManualNotification = async (userId, title, message, data = {}) => {
    return await notificationService.createNotification(
        userId,
        NOTIFICATION_TYPES.MANUAL,
        title,
        message,
        data
    );
};

/**
 * Create a broadcast notification for all users (manual)
 * Note: Video notifications are handled automatically by triggers
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional data
 */
export const createBroadcastNotification = async (title, message, data = {}) => {
    return await notificationService.createBroadcastNotification(
        NOTIFICATION_TYPES.MANUAL,
        title,
        message,
        data
    );
};

/**
 * Utility functions to get notification display information
 */
export const getNotificationIcon = (type) => {
    switch (type) {
        case NOTIFICATION_TYPES.SERVICE_REQUEST:
        case NOTIFICATION_TYPES.SERVICE_REQUEST_STATUS:
            return '📋';
        case NOTIFICATION_TYPES.SCREENING_RESULT:
            return '🔬';
        case NOTIFICATION_TYPES.VIDEO:
            return '🎥';
        default:
            return '📢';
    }
};

export const getNotificationColor = (type) => {
    switch (type) {
        case NOTIFICATION_TYPES.SERVICE_REQUEST:
            return 'blue';
        case NOTIFICATION_TYPES.SERVICE_REQUEST_STATUS:
            return 'green';
        case NOTIFICATION_TYPES.SCREENING_RESULT:
            return 'purple';
        case NOTIFICATION_TYPES.VIDEO:
            return 'red';
        default:
            return 'gray';
    }
};
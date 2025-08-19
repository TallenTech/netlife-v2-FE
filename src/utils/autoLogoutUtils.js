import { getAutoLogoutConfig } from '@/config/autoLogout';

// Utility functions for auto-logout testing and debugging

export const autoLogoutUtils = {
    // Get current auto-logout configuration
    getConfig: () => getAutoLogoutConfig(),

    // Simulate user activity to reset the timer
    simulateActivity: () => {
        // Dispatch a mousemove event to simulate user activity
        window.dispatchEvent(new Event('mousemove'));
        console.log('Activity simulated - timer reset');
    },

    // Get remaining time until logout (for debugging)
    getRemainingTime: () => {
        const lastActivity = localStorage.getItem('netlife_last_activity');
        if (!lastActivity) return null;

        const config = getAutoLogoutConfig();
        const timeSinceActivity = Date.now() - parseInt(lastActivity);
        const remainingTime = config.inactivityTimeout - timeSinceActivity;

        return Math.max(0, remainingTime);
    },

    // Force trigger warning (for testing)
    triggerWarning: () => {
        const warningEvent = new CustomEvent('showAutoLogoutWarning', {
            detail: {
                message: 'Test warning - you will be logged out in 5 minutes.',
                remainingTime: 5 * 60 * 1000
            }
        });
        window.dispatchEvent(warningEvent);
        console.log('Warning triggered for testing');
    },

    // Clear all auto-logout related storage
    clearStorage: () => {
        const config = getAutoLogoutConfig();
        localStorage.removeItem(config.storageKeys.lastLogout);
        localStorage.removeItem('netlife_last_activity');
        console.log('Auto-logout storage cleared');
    },

    // Get debug information
    getDebugInfo: () => {
        const config = getAutoLogoutConfig();
        const lastActivity = localStorage.getItem('netlife_last_activity');
        const lastLogout = localStorage.getItem(config.storageKeys.lastLogout);

        return {
            config: {
                inactivityTimeout: config.inactivityTimeout / 1000 / 60, // in minutes
                warningTimeout: config.warningTimeout / 1000 / 60, // in minutes
                checkInterval: config.checkInterval / 1000, // in seconds
            },
            storage: {
                lastActivity: lastActivity ? new Date(parseInt(lastActivity)).toISOString() : null,
                lastLogout: lastLogout ? new Date(parseInt(lastLogout)).toISOString() : null,
            },
            currentTime: new Date().toISOString(),
            remainingTime: autoLogoutUtils.getRemainingTime() / 1000 / 60, // in minutes
        };
    }
};

// Make utilities available globally for debugging (development only)
if (import.meta.env.DEV) {
    window.autoLogoutUtils = autoLogoutUtils;
    console.log('Auto-logout utilities available at window.autoLogoutUtils');
}

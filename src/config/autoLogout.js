// Auto-logout configuration
export const AUTO_LOGOUT_CONFIG = {
    // Inactivity timeout (3 minutes for testing)
    inactivityTimeout: 3 * 60 * 1000,

    // Warning timeout (1 minute before logout for testing)
    warningTimeout: 1 * 60 * 1000,

    // Check interval (10 seconds for testing)
    checkInterval: 10 * 1000,

    // Activity events to monitor
    activityEvents: [
        'mousedown',
        'mousemove',
        'keypress',
        'scroll',
        'touchstart',
        'click'
    ],

    // Warning message
    warningMessage: 'You will be logged out due to inactivity in 1 minute.'
};

// Environment-specific overrides
export const getAutoLogoutConfig = () => {
    const config = { ...AUTO_LOGOUT_CONFIG };

    // Override with environment variables if available
    if (import.meta.env.VITE_AUTO_LOGOUT_TIMEOUT) {
        config.inactivityTimeout = parseInt(import.meta.env.VITE_AUTO_LOGOUT_TIMEOUT) * 60 * 1000;
    }

    if (import.meta.env.VITE_AUTO_LOGOUT_WARNING) {
        config.warningTimeout = parseInt(import.meta.env.VITE_AUTO_LOGOUT_WARNING) * 60 * 1000;
    }

    return config;
};

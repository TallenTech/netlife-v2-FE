import { useEffect, useRef, useCallback } from 'react';
import { getAutoLogoutConfig } from '@/config/autoLogout';

const useAutoLogout = (logout, isAuthenticated, options = {}) => {
    const config = getAutoLogoutConfig();
    const {
        inactivityTimeout = config.inactivityTimeout,
        warningTimeout = config.warningTimeout,
        checkInterval = config.checkInterval,
    } = options;

    const timeoutRef = useRef(null);
    const warningTimeoutRef = useRef(null);
    const checkIntervalRef = useRef(null);
    const lastActivityRef = useRef(Date.now());
    const isWarningShownRef = useRef(false);

    // Reset activity timer
    const resetActivityTimer = useCallback(() => {
        lastActivityRef.current = Date.now();
        isWarningShownRef.current = false;

        // Store activity timestamp in localStorage for debugging
        localStorage.setItem('netlife_last_activity', lastActivityRef.current.toString());

        // Clear existing timeouts
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current);
            warningTimeoutRef.current = null;
        }
    }, []);

    // Show warning notification
    const showWarning = useCallback(() => {
        if (isWarningShownRef.current) return;

        isWarningShownRef.current = true;

        // Create a custom warning notification
        const warningEvent = new CustomEvent('showAutoLogoutWarning', {
            detail: {
                message: config.warningMessage,
                remainingTime: warningTimeout
            }
        });
        window.dispatchEvent(warningEvent);
    }, [warningTimeout, config.warningMessage]);

    // Handle auto logout
    const handleAutoLogout = useCallback(() => {
        console.log('Auto-logout due to inactivity');
        logout();
    }, [logout]);

    // Check for inactivity
    const checkInactivity = useCallback(() => {
        if (!isAuthenticated) return;

        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityRef.current;

        // Show warning if approaching timeout
        if (timeSinceLastActivity >= (inactivityTimeout - warningTimeout) && !isWarningShownRef.current) {
            showWarning();
        }

        // Logout if timeout exceeded
        if (timeSinceLastActivity >= inactivityTimeout) {
            handleAutoLogout();
        }
    }, [isAuthenticated, inactivityTimeout, warningTimeout, showWarning, handleAutoLogout]);

    // Activity event handlers
    const handleActivity = useCallback(() => {
        resetActivityTimer();
    }, [resetActivityTimer]);



    useEffect(() => {
        if (!isAuthenticated) {
            // Clear all timeouts if not authenticated
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
            return;
        }

        // Set up activity listeners
        const activityEvents = config.activityEvents;

        activityEvents.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });



        // Start inactivity checking
        checkIntervalRef.current = setInterval(checkInactivity, checkInterval);

        // Initial activity reset
        resetActivityTimer();

        // Cleanup function
        return () => {
            activityEvents.forEach(event => {
                document.removeEventListener(event, handleActivity, true);
            });

            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
        };
    }, [
        isAuthenticated,
        handleActivity,
        checkInactivity,
        resetActivityTimer,
        checkInterval
    ]);



    return {
        resetActivityTimer,
        getTimeSinceLastActivity: () => Date.now() - lastActivityRef.current,
        getRemainingTime: () => Math.max(0, inactivityTimeout - (Date.now() - lastActivityRef.current))
    };
};

export default useAutoLogout;

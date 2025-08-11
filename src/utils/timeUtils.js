/**
 * Smart time formatting utility
 * Shows relative time for recent items, absolute dates for older items
 * 
 * Examples:
 * - Just now (< 5 seconds)
 * - 30 seconds ago
 * - 5 minutes ago
 * - 2 hours ago
 * - 1 day ago
 * - Jan 15 (> 2 days, same year)
 * - Jan 15, 2023 (different year)
 */

/**
 * Format time intelligently based on how recent it is
 * @param {string|Date} dateInput - The date to format
 * @returns {string} Formatted time string
 */
export const formatSmartTime = (dateInput) => {
    if (!dateInput) return 'Unknown time';

    const date = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // Less than 1 minute - show seconds
    if (diffInSeconds < 60) {
        if (diffInSeconds < 5) return 'Just now';
        return `${diffInSeconds} seconds ago`;
    }

    // Less than 1 hour - show minutes
    if (diffInMinutes < 60) {
        return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
    }

    // Less than 24 hours - show hours
    if (diffInHours < 24) {
        return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    }

    // 1-2 days - show days
    if (diffInDays <= 2) {
        return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    }

    // More than 2 days - show formatted date
    const isThisYear = date.getFullYear() === now.getFullYear();

    if (isThisYear) {
        // Same year - show month and day
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    } else {
        // Different year - show month, day, and year
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
};

/**
 * Format time with "Requested" prefix for service requests
 * @param {string|Date} dateInput - The date to format
 * @returns {string} Formatted time string with prefix
 */
export const formatRequestTime = (dateInput) => {
    const smartTime = formatSmartTime(dateInput);

    // For relative times (contains "ago" or "Just now"), use different prefix
    if (smartTime.includes('ago') || smartTime === 'Just now') {
        return smartTime;
    }

    // For absolute dates, use "Requested on" prefix
    return `Requested on ${smartTime}`;
};

/**
 * Get a short version of the time for compact displays
 * @param {string|Date} dateInput - The date to format
 * @returns {string} Short formatted time string
 */
export const formatShortTime = (dateInput) => {
    if (!dateInput) return '';

    const date = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // Less than 1 minute
    if (diffInSeconds < 60) {
        return diffInSeconds < 5 ? 'now' : `${diffInSeconds}s`;
    }

    // Less than 1 hour
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m`;
    }

    // Less than 24 hours
    if (diffInHours < 24) {
        return `${diffInHours}h`;
    }

    // 1-7 days
    if (diffInDays <= 7) {
        return `${diffInDays}d`;
    }

    // More than 7 days - show date
    const isThisYear = date.getFullYear() === now.getFullYear();

    if (isThisYear) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: '2-digit'
        });
    }
};
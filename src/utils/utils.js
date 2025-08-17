// Utility functions for the application

/**
 * Format a number with appropriate suffixes (K, M, B)
 * @param {number} num - The number to format
 * @returns {string} - Formatted number string
 */
export const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return "0";

    const numValue = Number(num);

    if (numValue < 1000) return numValue.toString();
    if (numValue < 1000000) return (numValue / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    if (numValue < 1000000000) return (numValue / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    return (numValue / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
};

/**
 * Get user's IP address (client-side approximation)
 * @returns {string} - IP address or empty string
 */
export const getClientIP = async () => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.warn('Failed to get IP address:', error);
        return '';
    }
};

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Error handling utilities for the Services Management System
 */

/**
 * Transform API errors into user-friendly messages
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export const handleApiError = (error) => {
    // Supabase configuration errors
    if (error.message.includes('Supabase not configured') || error.message.includes('supabaseUrl is required')) {
        return 'Database connection not configured. Using offline data.';
    }

    // Network errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return 'Network error. Please check your connection and try again.';
    }

    // Authentication errors
    if (error.message.includes('JWT') || error.message.includes('token')) {
        return 'Session expired. Please log in again.';
    }

    // Authorization errors
    if (error.message.includes('Row Level Security') || error.message.includes('permission')) {
        return 'Access denied. Please ensure you are logged in.';
    }

    // Validation errors
    if (error.message.includes('violates') || error.message.includes('constraint')) {
        return 'Invalid data provided. Please check your input and try again.';
    }

    // Database connection errors
    if (error.message.includes('connection') || error.message.includes('timeout')) {
        return 'Database connection error. Please try again in a moment.';
    }

    // Default error message
    return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Create a standardized error object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Object} Standardized error object
 */
export const createError = (message, code = 'UNKNOWN_ERROR', details = {}) => {
    return {
        message,
        code,
        details,
        timestamp: new Date().toISOString()
    };
};

/**
 * Log errors with context
 * @param {Error|null} error - The error object (null for informational logging)
 * @param {string} context - Context where the error occurred
 * @param {Object} additionalData - Additional data to log
 */
export const logError = (error, context = 'Unknown', additionalData = {}) => {
    if (error) {
        console.error(`[${context}] Error:`, {
            message: error.message,
            stack: error.stack,
            context,
            additionalData,
            timestamp: new Date().toISOString()
        });
    } else {
        // Informational logging when error is null
        console.log(`[${context}] Info:`, {
            context,
            additionalData,
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Result of the function or throws after max retries
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (attempt === maxRetries) {
                throw error;
            }

            // Exponential backoff: delay = baseDelay * 2^attempt
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
};

/**
 * Check if error is retryable
 * @param {Error} error - The error object
 * @returns {boolean} True if error is retryable
 */
export const isRetryableError = (error) => {
    const retryableMessages = [
        'Failed to fetch',
        'NetworkError',
        'timeout',
        'connection',
        'ECONNRESET',
        'ENOTFOUND'
    ];

    return retryableMessages.some(msg =>
        error.message.toLowerCase().includes(msg.toLowerCase())
    );
};

/**
 * Validate required fields in an object
 * @param {Object} obj - Object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @throws {Error} If any required field is missing
 */
export const validateRequiredFields = (obj, requiredFields) => {
    const missingFields = requiredFields.filter(field =>
        !obj || obj[field] === undefined || obj[field] === null || obj[field] === ''
    );

    if (missingFields.length > 0) {
        throw createError(
            `Missing required fields: ${missingFields.join(', ')}`,
            'VALIDATION_ERROR',
            { missingFields, providedObject: obj }
        );
    }
};
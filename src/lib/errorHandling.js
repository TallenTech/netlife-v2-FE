/**
 * Comprehensive Error Handling System for WhatsApp Authentication
 * Provides user-friendly error messages, retry logic, and network error handling
 */

/**
 * Error code mapping for user-friendly messages
 * Maps API error codes to user-friendly messages with actionable guidance
 */
export const ERROR_MESSAGES = {
    // Phone number validation errors
    'INVALID_PHONE_NUMBER': {
        title: 'Invalid Phone Number',
        message: 'Please enter a valid Uganda phone number in the format +256XXXXXXXXX',
        action: 'Check your number format and try again',
        severity: 'warning'
    },
    'PHONE_NUMBER_REQUIRED': {
        title: 'Phone Number Required',
        message: 'Please enter your phone number to continue',
        action: 'Enter your WhatsApp phone number',
        severity: 'info'
    },

    // Rate limiting errors
    'RATE_LIMIT_EXCEEDED': {
        title: 'Too Many Requests',
        message: 'You\'ve made too many requests. Please wait before trying again.',
        action: 'Wait for the countdown to finish, then try again',
        severity: 'warning',
        retryable: true,
        retryDelay: 300 // 5 minutes
    },
    'DAILY_LIMIT_EXCEEDED': {
        title: 'Daily Limit Reached',
        message: 'You\'ve reached the daily limit for verification codes.',
        action: 'Please try again tomorrow or contact support',
        severity: 'error'
    },

    // OTP verification errors
    'INVALID_CODE': {
        title: 'Incorrect Code',
        message: 'The verification code you entered is incorrect.',
        action: 'Please check the code and try again',
        severity: 'warning',
        retryable: true
    },
    'CODE_EXPIRED': {
        title: 'Code Expired',
        message: 'The verification code has expired.',
        action: 'Request a new verification code',
        severity: 'warning',
        retryable: true
    },
    'CODE_ALREADY_USED': {
        title: 'Code Already Used',
        message: 'This verification code has already been used.',
        action: 'Request a new verification code',
        severity: 'warning',
        retryable: true
    },
    'MAX_ATTEMPTS_EXCEEDED': {
        title: 'Too Many Attempts',
        message: 'You\'ve made too many verification attempts.',
        action: 'Request a new verification code',
        severity: 'error',
        retryable: true,
        retryDelay: 60
    },

    // WhatsApp API errors
    'WHATSAPP_API_ERROR': {
        title: 'WhatsApp Service Error',
        message: 'Unable to send WhatsApp message at this time.',
        action: 'Please try again in a few moments',
        severity: 'error',
        retryable: true,
        retryDelay: 30
    },
    'WHATSAPP_NUMBER_NOT_REGISTERED': {
        title: 'WhatsApp Not Found',
        message: 'This phone number is not registered with WhatsApp.',
        action: 'Please check your number or use a WhatsApp-registered number',
        severity: 'error'
    },
    'WHATSAPP_BUSINESS_RESTRICTION': {
        title: 'Business Account Restriction',
        message: 'WhatsApp Business restrictions prevent sending to this number.',
        action: 'Please try with a different number or contact support',
        severity: 'error'
    },

    // Network and system errors
    'NETWORK_ERROR': {
        title: 'Connection Problem',
        message: 'Unable to connect to our servers.',
        action: 'Check your internet connection and try again',
        severity: 'error',
        retryable: true,
        retryDelay: 10
    },
    'TIMEOUT_ERROR': {
        title: 'Request Timeout',
        message: 'The request took too long to complete.',
        action: 'Please try again',
        severity: 'warning',
        retryable: true,
        retryDelay: 5
    },
    'SERVER_ERROR': {
        title: 'Server Error',
        message: 'Our servers are experiencing issues.',
        action: 'Please try again in a few moments',
        severity: 'error',
        retryable: true,
        retryDelay: 30
    },
    'INTERNAL_ERROR': {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred.',
        action: 'Please try again or contact support if the problem persists',
        severity: 'error',
        retryable: true,
        retryDelay: 15
    },

    // Authentication errors
    'USER_NOT_FOUND': {
        title: 'Account Not Found',
        message: 'No account found with this phone number.',
        action: 'Please sign up first or check your phone number',
        severity: 'info'
    },
    'ACCOUNT_SUSPENDED': {
        title: 'Account Suspended',
        message: 'Your account has been temporarily suspended.',
        action: 'Please contact support for assistance',
        severity: 'error'
    },

    // Default fallback
    'UNKNOWN_ERROR': {
        title: 'Unexpected Error',
        message: 'An unknown error occurred.',
        action: 'Please try again or contact support',
        severity: 'error',
        retryable: true,
        retryDelay: 10
    }
};

/**
 * Get user-friendly error information from error code
 * @param {string} errorCode - The error code from the API
 * @param {string} fallbackMessage - Fallback message if error code not found
 * @returns {Object} Error information object
 */
export const getErrorInfo = (errorCode, fallbackMessage = null) => {
    const errorInfo = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['UNKNOWN_ERROR'];

    // If we have a fallback message, use it but keep the structure
    if (fallbackMessage && !ERROR_MESSAGES[errorCode]) {
        return {
            ...errorInfo,
            message: fallbackMessage
        };
    }

    return errorInfo;
};

/**
 * Network error detection and classification
 * @param {Error} error - The caught error object
 * @returns {string} Classified error code
 */
export const classifyNetworkError = (error) => {
    if (!error) return 'UNKNOWN_ERROR';

    // Check for network connectivity issues
    if (!navigator.onLine) {
        return 'NETWORK_ERROR';
    }

    // Check for timeout errors
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
        return 'TIMEOUT_ERROR';
    }

    // Check for fetch/network errors
    if (error.name === 'TypeError' && error.message?.includes('fetch')) {
        return 'NETWORK_ERROR';
    }

    // Check for server errors based on status codes
    if (error.status) {
        if (error.status >= 500) {
            return 'SERVER_ERROR';
        } else if (error.status === 429) {
            return 'RATE_LIMIT_EXCEEDED';
        } else if (error.status >= 400) {
            return 'INVALID_REQUEST';
        }
    }

    // Check for specific error messages
    if (error.message) {
        const message = error.message.toLowerCase();

        if (message.includes('network') || message.includes('connection')) {
            return 'NETWORK_ERROR';
        }

        if (message.includes('timeout')) {
            return 'TIMEOUT_ERROR';
        }

        if (message.includes('rate limit') || message.includes('too many')) {
            return 'RATE_LIMIT_EXCEEDED';
        }
    }

    return 'UNKNOWN_ERROR';
};

/**
 * Retry logic configuration
 * @param {string} errorCode - The error code
 * @returns {Object} Retry configuration
 */
export const getRetryConfig = (errorCode) => {
    const errorInfo = getErrorInfo(errorCode);

    return {
        retryable: errorInfo.retryable || false,
        delay: errorInfo.retryDelay || 10,
        maxAttempts: errorInfo.maxAttempts || 3
    };
};

/**
 * Format countdown timer display
 * @param {number} seconds - Seconds remaining
 * @returns {string} Formatted time string
 */
export const formatCountdown = (seconds) => {
    if (seconds <= 0) return '';

    if (seconds < 60) {
        return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes}m`;
};

/**
 * Enhanced error handler with toast notifications
 * @param {Object} toast - Toast notification function
 * @param {string} errorCode - Error code from API
 * @param {string} fallbackMessage - Fallback error message
 * @param {Object} options - Additional options
 */
export const handleError = (toast, errorCode, fallbackMessage = null, options = {}) => {
    const errorInfo = getErrorInfo(errorCode, fallbackMessage);
    const { showAction = true, duration = 5000 } = options;

    const description = showAction && errorInfo.action
        ? `${errorInfo.message} ${errorInfo.action}`
        : errorInfo.message;

    toast({
        title: errorInfo.title,
        description,
        variant: errorInfo.severity === 'error' ? 'destructive' : 'default',
        duration: errorInfo.severity === 'error' ? 8000 : duration
    });

    return errorInfo;
};

/**
 * Validation error handler for form fields
 * @param {string} field - Field name
 * @param {string} error - Validation error message
 * @returns {Object} Formatted validation error
 */
export const handleValidationError = (field, error) => {
    return {
        field,
        message: error,
        type: 'validation'
    };
};

/**
 * Check if error is retryable and get retry delay
 * @param {string} errorCode - Error code
 * @returns {Object} Retry information
 */
export const getRetryInfo = (errorCode) => {
    const config = getRetryConfig(errorCode);

    return {
        canRetry: config.retryable,
        delay: config.delay,
        maxAttempts: config.maxAttempts,
        formattedDelay: formatCountdown(config.delay)
    };
};
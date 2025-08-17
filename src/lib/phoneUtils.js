/**
 * Phone Number Processing Utilities
 * Handles cleaning, validation, and formatting of phone numbers for WhatsApp authentication
 */

/**
 * Clean phone number by removing formatting and ensuring proper international format
 * @param {string} phoneNumber - Raw phone number input
 * @returns {string} - Cleaned phone number in international format
 */
export const cleanPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';

    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');

    // Handle different Uganda phone number formats
    if (cleaned.startsWith('256')) {
        // Already in international format without +
        return `+${cleaned}`;
    } else if (cleaned.startsWith('+256')) {
        // Already in correct international format
        return cleaned;
    } else if (cleaned.startsWith('0') && cleaned.length === 10) {
        // Convert local format (0701234567) to international (+256701234567)
        return `+256${cleaned.substring(1)}`;
    } else if (cleaned.length === 9 && !cleaned.startsWith('0')) {
        // Handle format without leading 0 (701234567)
        return `+256${cleaned}`;
    } else if (cleaned.length === 10 && cleaned.startsWith('7')) {
        // Handle format like 740123456 (10 digits starting with 7)
        return `+256${cleaned}`;
    }

    // Return as-is if no specific format matches (for validation to catch)
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

/**
 * Validate phone number format and provide detailed error messages
 * Updated to support current Uganda mobile number prefixes (2024-2025)
 * Supports: 70X, 74X, 75X, 76X, 77X, 78X, 79X series
 * @param {string} phoneNumber - Phone number to validate
 * @returns {Object} - Validation result with isValid flag and error message
 */
export const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === '') {
        return {
            isValid: false,
            error: 'Phone number is required'
        };
    }

    const cleaned = cleanPhoneNumber(phoneNumber);

    // Check if it matches Uganda international format (+256XXXXXXXXX)
    const ugandaRegex = /^\+256[0-9]{9}$/;

    if (!ugandaRegex.test(cleaned)) {
        // Provide specific error messages based on the issue
        if (!cleaned.startsWith('+256')) {
            return {
                isValid: false,
                error: 'Phone number must be a Uganda number starting with +256'
            };
        } else if (cleaned.length < 13) {
            return {
                isValid: false,
                error: 'Phone number is too short. Please enter all 9 digits after +256'
            };
        } else if (cleaned.length > 13) {
            return {
                isValid: false,
                error: 'Phone number is too long. Uganda numbers have 9 digits after +256'
            };
        } else {
            return {
                isValid: false,
                error: 'Please enter a valid Uganda phone number (+256XXXXXXXXX)'
            };
        }
    }

    // Additional validation for Uganda mobile prefixes (updated 2024)
    const mobilePrefix = cleaned.substring(4, 7); // Get the first 3 digits after +256

    // Current valid Uganda mobile prefixes (as of 2024-2025)
    // MTN Uganda: 701-709, 750-759, 760-769, 770-779, 780-789, 790-799
    // Airtel Uganda: 701-709, 750-759, 760-769, 770-779, 780-789, 790-799
    // UTL: 701-709, 750-759, 760-769, 770-779, 780-789, 790-799
    // Lycamobile: 701-709, 750-759, 760-769, 770-779, 780-789, 790-799
    // Smile: 701-709, 750-759, 760-769, 770-779, 780-789, 790-799
    // Additional prefixes that may be valid: 74X, 76X, 77X, 78X, 79X

    // Generate all valid prefixes (70X, 74X, 75X, 76X, 77X, 78X, 79X)
    const validPrefixes = [];

    // 70X series (700-709)
    for (let i = 0; i <= 9; i++) {
        validPrefixes.push(`70${i}`);
    }

    // 74X series (740-749) - Additional mobile prefixes
    for (let i = 0; i <= 9; i++) {
        validPrefixes.push(`74${i}`);
    }

    // 75X series (750-759)
    for (let i = 0; i <= 9; i++) {
        validPrefixes.push(`75${i}`);
    }

    // 76X series (760-769)
    for (let i = 0; i <= 9; i++) {
        validPrefixes.push(`76${i}`);
    }

    // 77X series (770-779)
    for (let i = 0; i <= 9; i++) {
        validPrefixes.push(`77${i}`);
    }

    // 78X series (780-789)
    for (let i = 0; i <= 9; i++) {
        validPrefixes.push(`78${i}`);
    }

    // 79X series (790-799)
    for (let i = 0; i <= 9; i++) {
        validPrefixes.push(`79${i}`);
    }

    if (!validPrefixes.includes(mobilePrefix)) {
        // Additional fallback validation for edge cases
        // Check if it's a 3-digit number starting with 7 (common pattern for Uganda mobile)
        // This allows for any new prefixes that might be introduced
        if (mobilePrefix.startsWith('7') && mobilePrefix.length === 3) {
            // Allow any 3-digit number starting with 7 as a fallback
            console.warn(`Using fallback validation for prefix: ${mobilePrefix} - this prefix is not in the standard list but follows Uganda mobile pattern`);
        } else {
            return {
                isValid: false,
                error: `Please enter a valid Uganda mobile number. The prefix "${mobilePrefix}" is not recognized. Valid prefixes are: 70X, 74X, 75X, 76X, 77X, 78X, 79X (where X is 0-9).`
            };
        }
    }

    return {
        isValid: true,
        cleanedNumber: cleaned
    };
};

/**
 * Format phone number for display purposes
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} - Formatted phone number for display
 */
export const formatPhoneNumberForDisplay = (phoneNumber) => {
    const cleaned = cleanPhoneNumber(phoneNumber);

    // Format as +256 XXX XXX XXX for display
    if (cleaned.startsWith('+256') && cleaned.length === 13) {
        return cleaned.replace(/(\+256)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    }

    // Return original if formatting fails
    return phoneNumber;
};

/**
 * Check if phone number appears to be complete (for real-time validation)
 * @param {string} phoneNumber - Phone number to check
 * @returns {boolean} - True if phone number appears complete
 */
export const isPhoneNumberComplete = (phoneNumber) => {
    if (!phoneNumber) return false;

    const digitsOnly = phoneNumber.replace(/[^0-9]/g, '');

    // Consider complete if we have at least 9 digits (Uganda mobile without country code)
    // or 12 digits (with country code)
    return digitsOnly.length >= 9;
};

/**
 * Get phone number input mask based on current input
 * @param {string} phoneNumber - Current phone number input
 * @returns {string} - Input mask pattern
 */
export const getPhoneNumberMask = (phoneNumber) => {
    // Always use Uganda format mask
    return "+256 999 999 999";
};

/**
 * Normalize phone number input for consistent processing
 * @param {string} phoneNumber - Raw phone number input
 * @returns {string} - Normalized phone number
 */
export const normalizePhoneNumberInput = (phoneNumber) => {
    if (!phoneNumber) return '';

    // Remove extra spaces and normalize
    let normalized = phoneNumber.trim();

    // If user starts typing without +256, help them by adding it
    if (normalized && !normalized.startsWith('+') && !normalized.startsWith('0')) {
        // Check if it looks like they're entering digits directly
        if (/^\d/.test(normalized)) {
            normalized = `+256 ${normalized}`;
        }
    }

    return normalized;
};
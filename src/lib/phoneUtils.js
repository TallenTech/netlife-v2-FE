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
    }

    // Return as-is if no specific format matches (for validation to catch)
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

/**
 * Validate phone number format and provide detailed error messages
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

    // Additional validation for common Uganda mobile prefixes
    const mobilePrefix = cleaned.substring(4, 7); // Get the first 3 digits after +256
    const validPrefixes = ['701', '702', '703', '704', '705', '706', '707', '708', '709',
        '750', '751', '752', '753', '754', '755', '756', '757', '758', '759',
        '760', '761', '762', '763', '764', '765', '766', '767', '768', '769',
        '770', '771', '772', '773', '774', '775', '776', '777', '778', '779',
        '780', '781', '782', '783', '784', '785', '786', '787', '788', '789',
        '790', '791', '792', '793', '794', '795', '796', '797', '798', '799'];

    if (!validPrefixes.includes(mobilePrefix)) {
        return {
            isValid: false,
            error: 'Please enter a valid Uganda mobile number. Landline numbers are not supported.'
        };
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
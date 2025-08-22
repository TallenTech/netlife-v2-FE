/**
 * Supported Languages Configuration
 * Languages relevant to the Uganda market and NetLife's diverse user base
 */

export const SUPPORTED_LANGUAGES = [
    {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇺🇸',
        isDefault: true,
        isRTL: false
    },
    {
        code: 'sw',
        name: 'Swahili',
        nativeName: 'Kiswahili',
        flag: '🇹🇿',
        isDefault: false,
        isRTL: false
    },
    {
        code: 'lg',
        name: 'Luganda',
        nativeName: 'Luganda',
        flag: '🇺🇬',
        isDefault: false,
        isRTL: false
    },
    {
        code: 'rn',
        name: 'Runyankole',
        nativeName: 'Runyankole',
        flag: '🇺🇬',
        isDefault: false,
        isRTL: false
    },
    {
        code: 'ach',
        name: 'Acholi',
        nativeName: 'Acholi',
        flag: '🇺🇬',
        isDefault: false,
        isRTL: false
    },
    {
        code: 'teo',
        name: 'Ateso',
        nativeName: 'Ateso',
        flag: '🇺🇬',
        isDefault: false,
        isRTL: false
    }
];

/**
 * Get language by code
 * @param {string} code - Language code
 * @returns {Object|null} Language object or null if not found
 */
export const getLanguageByCode = (code) => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || null;
};

/**
 * Get default language
 * @returns {Object} Default language object
 */
export const getDefaultLanguage = () => {
    return SUPPORTED_LANGUAGES.find(lang => lang.isDefault) || SUPPORTED_LANGUAGES[0];
};

/**
 * Get language codes array
 * @returns {string[]} Array of language codes
 */
export const getLanguageCodes = () => {
    return SUPPORTED_LANGUAGES.map(lang => lang.code);
};

/**
 * Get language names array
 * @returns {string[]} Array of language names
 */
export const getLanguageNames = () => {
    return SUPPORTED_LANGUAGES.map(lang => lang.name);
};

/**
 * Check if language code is supported
 * @param {string} code - Language code to check
 * @returns {boolean} True if supported, false otherwise
 */
export const isLanguageSupported = (code) => {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
};

/**
 * Get language display name
 * @param {string} code - Language code
 * @param {boolean} showNative - Whether to show native name
 * @returns {string} Display name
 */
export const getLanguageDisplayName = (code, showNative = false) => {
    const language = getLanguageByCode(code);
    if (!language) return code;

    if (showNative && language.nativeName !== language.name) {
        return `${language.name} (${language.nativeName})`;
    }

    return language.name;
};

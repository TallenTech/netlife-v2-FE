/**
 * Supported Languages Configuration
 * Comprehensive list of languages for Uganda and the surrounding region
 * Organized by importance: Official languages first, then major regional languages
 */

export const SUPPORTED_LANGUAGES = [
    // Official Languages
    {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇺🇸',
        isDefault: true,
        isRTL: false,
        region: 'Official',
        speakers: 'Widely spoken'
    },
    {
        code: 'sw',
        name: 'Swahili',
        nativeName: 'Kiswahili',
        flag: '🇹🇿',
        isDefault: false,
        isRTL: false,
        region: 'Official',
        speakers: 'National language'
    },

    // Major Ugandan Languages (Bantu)
    {
        code: 'lg',
        name: 'Luganda',
        nativeName: 'Luganda',
        flag: '🇺🇬',
        isDefault: false,
        isRTL: false,
        region: 'Central Uganda',
        speakers: '~7 million'
    },
    {
        code: 'rn',
        name: 'Runyankole',
        nativeName: 'Runyankole',
        flag: '🇺🇬',
        isDefault: false,
        isRTL: false,
        region: 'Western Uganda',
        speakers: '~2.3 million'
    },
    {
        code: 'rny',
        name: 'Runyoro',
        nativeName: 'Runyoro',
        flag: '🇺🇬',
        isDefault: false,
        isRTL: false,
        region: 'Western Uganda',
        speakers: '~700,000'
    },
    {
        code: 'rng',
        name: 'Rukiga',
        nativeName: 'Rukiga',
        flag: '🇺🇬',
        isDefault: false,
        isRTL: false,
        region: 'Southwestern Uganda',
        speakers: '~1.5 million'
    },
    {
        code: 'xog',
        name: 'Lusoga',
        nativeName: 'Lusoga',
        flag: '🇺🇬',
        isDefault: false,
        isRTL: false,
        region: 'Eastern Uganda',
        speakers: '~2.5 million'
    },
    {
        code: 'lgg',
        name: 'Lugbara',
        nativeName: 'Lugbara',
        flag: '🇺🇬',
        isDefault: false,
        isRTL: false,
        region: 'Northwestern Uganda',
        speakers: '~1.2 million'
    },

    // Northern Uganda Languages (Nilotic)
    {
        code: 'ach',
        name: 'Acholi',
        nativeName: 'Acholi',
        flag: '🇺🇬',
        isDefault: false,
        isRTL: false,
        region: 'Northern Uganda',
        speakers: '~1.2 million'
    },
    {
        code: 'teo',
        name: 'Ateso',
        nativeName: 'Ateso',
        flag: '🇺🇬',
        isDefault: false,
        isRTL: false,
        region: 'Eastern Uganda',
        speakers: '~1.9 million'
    },
    {
        code: 'lng',
        name: 'Lango',
        nativeName: 'Lango',
        flag: '🇺🇬',
        isDefault: false,
        isRTL: false,
        region: 'Central Northern Uganda',
        speakers: '~1.5 million'
    },
    {
        code: 'alz',
        name: 'Alur',
        nativeName: 'Alur',
        flag: '🇺🇬',
        isDefault: false,
        isRTL: false,
        region: 'Northwestern Uganda',
        speakers: '~800,000'
    },

    // Eastern Uganda Languages
    {
        code: 'kln',
        name: 'Kalenjin',
        nativeName: 'Kalenjin',
        flag: '🇰🇪',
        isDefault: false,
        isRTL: false,
        region: 'Eastern Uganda/Kenya',
        speakers: '~500,000 in Uganda'
    },
    {
        code: 'mas',
        name: 'Maasai',
        nativeName: 'Maa',
        flag: '🇰🇪',
        isDefault: false,
        isRTL: false,
        region: 'Eastern Uganda/Kenya',
        speakers: '~300,000 in Uganda'
    },

    // Southwestern Uganda Languages
    {
        code: 'toi',
        name: 'Tonga',
        nativeName: 'Chitonga',
        flag: '🇿🇲',
        isDefault: false,
        isRTL: false,
        region: 'Southwestern Uganda',
        speakers: '~100,000'
    },

    // Regional Languages (Neighboring Countries)
    {
        code: 'rw',
        name: 'Kinyarwanda',
        nativeName: 'Kinyarwanda',
        flag: '🇷🇼',
        isDefault: false,
        isRTL: false,
        region: 'Rwanda/Southwestern Uganda',
        speakers: '~300,000 in Uganda'
    },
    {
        code: 'rn_Bi',
        name: 'Kirundi',
        nativeName: 'Kirundi',
        flag: '🇧🇮',
        isDefault: false,
        isRTL: false,
        region: 'Burundi/Southwestern Uganda',
        speakers: '~50,000 in Uganda'
    },
    {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        flag: '🇸🇩',
        isDefault: false,
        isRTL: true,
        region: 'Sudan/Northern Uganda',
        speakers: '~100,000 in Uganda'
    },

    // International Languages (for broader reach)
    {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        flag: '🇫🇷',
        isDefault: false,
        isRTL: false,
        region: 'International',
        speakers: 'Regional language'
    },
    {
        code: 'pt',
        name: 'Portuguese',
        nativeName: 'Português',
        flag: '🇵🇹',
        isDefault: false,
        isRTL: false,
        region: 'International',
        speakers: 'Regional language'
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

/**
 * Phone number validation and normalization utilities
 * Supports international phone number formats
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string;
  error?: string;
}

/**
 * Validates if a phone number is in a valid international format
 * Accepts formats like: +1234567890, +44 20 7946 0958, +33 1 42 86 83 26
 */
export function validatePhoneNumber(phone: string): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      error: 'Phone number is required and must be a string'
    };
  }

  // Remove all whitespace and special characters except +
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Must start with + and contain only digits after that
  const phoneRegex = /^\+[1-9]\d{6,14}$/;
  
  if (!phoneRegex.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'Phone number must be in international format (+country code followed by 7-15 digits)'
    };
  }

  // Additional validation for common country codes
  const countryCodeValidation = validateCountryCode(cleanPhone);
  if (!countryCodeValidation.isValid) {
    return countryCodeValidation;
  }

  return {
    isValid: true,
    normalized: cleanPhone
  };
}

/**
 * Normalizes a phone number to international format
 * Removes spaces, dashes, parentheses, and ensures + prefix
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all whitespace and special characters except +
  let normalized = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Ensure it starts with +
  if (!normalized.startsWith('+')) {
    // If it starts with 00, replace with +
    if (normalized.startsWith('00')) {
      normalized = '+' + normalized.substring(2);
    } else {
      // Assume it needs a + prefix
      normalized = '+' + normalized;
    }
  }
  
  return normalized;
}

/**
 * Validates country codes for common countries
 * This is a basic validation - in production you might want a more comprehensive list
 */
function validateCountryCode(phone: string): PhoneValidationResult {
  // Extract potential country code (1-4 digits after +)
  const countryCodeMatch = phone.match(/^\+(\d{1,4})/);
  if (!countryCodeMatch) {
    return {
      isValid: false,
      error: 'Invalid country code format'
    };
  }

  const countryCode = countryCodeMatch[1];
  const remainingDigits = phone.substring(countryCode.length + 1);

  // Common country codes and their expected lengths
  const countryCodeRules: Record<string, { minLength: number; maxLength: number }> = {
    '1': { minLength: 10, maxLength: 10 }, // US/Canada
    '44': { minLength: 10, maxLength: 10 }, // UK
    '33': { minLength: 9, maxLength: 9 }, // France
    '49': { minLength: 10, maxLength: 12 }, // Germany
    '39': { minLength: 9, maxLength: 11 }, // Italy
    '34': { minLength: 9, maxLength: 9 }, // Spain
    '81': { minLength: 10, maxLength: 11 }, // Japan
    '86': { minLength: 11, maxLength: 11 }, // China
    '91': { minLength: 10, maxLength: 10 }, // India
    '55': { minLength: 10, maxLength: 11 }, // Brazil
    '52': { minLength: 10, maxLength: 10 }, // Mexico
    '61': { minLength: 9, maxLength: 9 }, // Australia
    '7': { minLength: 10, maxLength: 10 }, // Russia/Kazakhstan
  };

  const rule = countryCodeRules[countryCode];
  if (rule) {
    const digitCount = remainingDigits.length;
    if (digitCount < rule.minLength || digitCount > rule.maxLength) {
      return {
        isValid: false,
        error: `Invalid phone number length for country code +${countryCode}. Expected ${rule.minLength}-${rule.maxLength} digits, got ${digitCount}`
      };
    }
  }

  // For unknown country codes, just check reasonable length bounds
  if (!rule && (remainingDigits.length < 6 || remainingDigits.length > 14)) {
    return {
      isValid: false,
      error: 'Phone number length must be between 7-15 digits total'
    };
  }

  return { isValid: true };
}

/**
 * Formats a phone number for display purposes
 * Converts +1234567890 to +1 (234) 567-8900 for US numbers, etc.
 */
export function formatPhoneNumber(phone: string): string {
  const validation = validatePhoneNumber(phone);
  if (!validation.isValid || !validation.normalized) {
    return phone; // Return original if invalid
  }

  const normalized = validation.normalized;
  
  // US/Canada formatting
  if (normalized.startsWith('+1') && normalized.length === 12) {
    const digits = normalized.substring(2);
    return `+1 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
  }
  
  // UK formatting
  if (normalized.startsWith('+44') && normalized.length === 13) {
    const digits = normalized.substring(3);
    return `+44 ${digits.substring(0, 2)} ${digits.substring(2, 6)} ${digits.substring(6)}`;
  }
  
  // Default: just add spaces every 3-4 digits after country code
  const countryCodeMatch = normalized.match(/^\+(\d{1,4})/);
  if (countryCodeMatch) {
    const countryCode = countryCodeMatch[1];
    const remainingDigits = normalized.substring(countryCode.length + 1);
    
    // Add spaces every 3 digits
    const formatted = remainingDigits.replace(/(\d{3})/g, '$1 ').trim();
    return `+${countryCode} ${formatted}`;
  }
  
  return normalized;
}

/**
 * Checks if two phone numbers are equivalent
 * Normalizes both numbers and compares them
 */
export function arePhoneNumbersEqual(phone1: string, phone2: string): boolean {
  const normalized1 = normalizePhoneNumber(phone1);
  const normalized2 = normalizePhoneNumber(phone2);
  
  const validation1 = validatePhoneNumber(normalized1);
  const validation2 = validatePhoneNumber(normalized2);
  
  if (!validation1.isValid || !validation2.isValid) {
    return false;
  }
  
  return validation1.normalized === validation2.normalized;
}
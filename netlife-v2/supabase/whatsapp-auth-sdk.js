/**
 * WhatsApp Authentication SDK
 * Simple JavaScript SDK for frontend integration
 */

class WhatsAppAuthSDK {
    constructor(config = {}) {
        this.baseURL = config.baseURL || process.env.REACT_APP_SUPABASE_URL || 'https://YOUR_SUPABASE_PROJECT_ID.supabase.co';
        this.anonKey = config.anonKey || process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
        this.userJWT = null;
    }

    /**
     * Get default headers for API requests
     */
    getHeaders(useUserJWT = false) {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${useUserJWT && this.userJWT ? this.userJWT : this.anonKey}`
        };
    }

    /**
     * Set user JWT token for authenticated requests
     */
    setUserToken(jwt) {
        this.userJWT = jwt;
    }

    /**
     * Validate phone number format
     */
    validatePhoneNumber(phone) {
        const phoneRegex = /^\+[1-9]\d{6,14}$/;
        return {
            isValid: phoneRegex.test(phone),
            error: phoneRegex.test(phone) ? null : 'Phone number must be in international format (+1234567890)'
        };
    }

    /**
     * Send OTP code to WhatsApp
     */
    async sendOTP(phoneNumber) {
        try {
            // Validate phone number
            const validation = this.validatePhoneNumber(phoneNumber);
            if (!validation.isValid) {
                return { success: false, error: validation.error };
            }

            const response = await fetch(`${this.baseURL}/functions/v1/send-code`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ phone: phoneNumber })
            });

            const result = await response.json();

            return {
                success: result.success,
                message: result.message,
                error: result.error,
                // Include OTP code in development mode for testing
                ...(result.code && { code: result.code })
            };
        } catch (error) {
            return {
                success: false,
                error: 'Network error: Unable to send OTP. Please check your connection.'
            };
        }
    }

    /**
     * Verify OTP code and authenticate user
     */
    async verifyOTP(phoneNumber, otpCode) {
        try {
            // Validate inputs
            const phoneValidation = this.validatePhoneNumber(phoneNumber);
            if (!phoneValidation.isValid) {
                return { success: false, error: phoneValidation.error };
            }

            if (!otpCode || otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
                return { success: false, error: 'OTP code must be 6 digits' };
            }

            const response = await fetch(`${this.baseURL}/functions/v1/verify-code`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    phone: phoneNumber,
                    code: otpCode
                })
            });

            const result = await response.json();

            if (result.success && result.user) {
                // Store user data locally (you might want to use a more secure method)
                localStorage.setItem('whatsapp_auth_user', JSON.stringify(result.user));

                // Note: In production, you should get and store the JWT token here
                // this.setUserToken(result.session?.access_token);
            }

            return {
                success: result.success,
                message: result.message,
                error: result.error,
                user: result.user,
                session: result.session
            };
        } catch (error) {
            return {
                success: false,
                error: 'Network error: Unable to verify OTP. Please check your connection.'
            };
        }
    }

    /**
     * Complete user profile
     */
    async completeProfile(profileData) {
        try {
            // Validate required fields
            if (!profileData.full_name || profileData.full_name.trim().length < 2) {
                return { success: false, error: 'Full name is required and must be at least 2 characters' };
            }

            // Validate username if provided
            if (profileData.username) {
                const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
                if (!usernameRegex.test(profileData.username)) {
                    return {
                        success: false,
                        error: 'Username must be 3-30 characters long and contain only letters, numbers, underscore, or hyphen'
                    };
                }
            }

            // Validate date of birth if provided
            if (profileData.date_of_birth) {
                const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dobRegex.test(profileData.date_of_birth)) {
                    return { success: false, error: 'Date of birth must be in YYYY-MM-DD format' };
                }

                const dob = new Date(profileData.date_of_birth);
                const now = new Date();
                if (dob > now) {
                    return { success: false, error: 'Date of birth cannot be in the future' };
                }
            }

            // Validate gender if provided
            const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
            if (profileData.gender && !validGenders.includes(profileData.gender)) {
                return { success: false, error: 'Invalid gender value' };
            }

            const response = await fetch(`${this.baseURL}/functions/v1/complete-profile`, {
                method: 'POST',
                headers: this.getHeaders(true), // Use user JWT token
                body: JSON.stringify(profileData)
            });

            const result = await response.json();

            if (result.success && result.profile) {
                // Update stored user data
                const storedUser = JSON.parse(localStorage.getItem('whatsapp_auth_user') || '{}');
                const updatedUser = { ...storedUser, profile: result.profile };
                localStorage.setItem('whatsapp_auth_user', JSON.stringify(updatedUser));
            }

            return {
                success: result.success,
                message: result.message,
                error: result.error,
                profile: result.profile
            };
        } catch (error) {
            return {
                success: false,
                error: 'Network error: Unable to complete profile. Please check your connection.'
            };
        }
    }

    /**
     * Get districts for location dropdown
     */
    async getDistricts() {
        try {
            const response = await fetch(`${this.baseURL}/rest/v1/districts?select=*`, {
                headers: {
                    'Authorization': `Bearer ${this.anonKey}`,
                    'apikey': this.anonKey
                }
            });

            const districts = await response.json();

            return {
                success: true,
                data: districts
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to load districts',
                data: []
            };
        }
    }

    /**
     * Get sub counties for a specific district
     */
    async getSubCounties(districtId) {
        try {
            const response = await fetch(`${this.baseURL}/rest/v1/sub_counties?select=*&district_id=eq.${districtId}`, {
                headers: {
                    'Authorization': `Bearer ${this.anonKey}`,
                    'apikey': this.anonKey
                }
            });

            const subCounties = await response.json();

            return {
                success: true,
                data: subCounties
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to load sub counties',
                data: []
            };
        }
    }

    /**
     * Get current authenticated user
     */
    getCurrentUser() {
        try {
            const userData = localStorage.getItem('whatsapp_auth_user');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    }

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem('whatsapp_auth_user');
        this.userJWT = null;
    }

    /**
     * Complete authentication flow helper
     */
    async authenticateWithWhatsApp(phoneNumber, otpCode) {
        // Step 1: Send OTP if not provided
        if (!otpCode) {
            return await this.sendOTP(phoneNumber);
        }

        // Step 2: Verify OTP
        return await this.verifyOTP(phoneNumber, otpCode);
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = WhatsAppAuthSDK;
} else if (typeof define === 'function' && define.amd) {
    // AMD
    define([], function () {
        return WhatsAppAuthSDK;
    });
} else {
    // Browser global
    window.WhatsAppAuthSDK = WhatsAppAuthSDK;
}

// Usage example:
/*
// Initialize SDK with environment variables
const auth = new WhatsAppAuthSDK({
  baseURL: process.env.REACT_APP_SUPABASE_URL,
  anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY
});

// Send OTP
const sendResult = await auth.sendOTP('+1234567890');
if (sendResult.success) {
  console.log('OTP sent successfully');
}

// Verify OTP
const verifyResult = await auth.verifyOTP('+1234567890', '123456');
if (verifyResult.success) {
  console.log('User authenticated:', verifyResult.user);
}

// Complete profile
const profileResult = await auth.completeProfile({
  username: 'johndoe123',
  full_name: 'John Doe',
  date_of_birth: '1990-05-15',
  gender: 'male',
  district: 'Your District',
  sub_county: 'Your Sub County',
  preferred_language: 'en'
});

// Get districts
const districts = await auth.getDistricts();
console.log('Available districts:', districts.data);

// Check authentication status
if (auth.isAuthenticated()) {
  const user = auth.getCurrentUser();
  console.log('Current user:', user);
}
*/
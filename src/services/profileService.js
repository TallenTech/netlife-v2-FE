/**
 * ProfileService - Handles all profile-related operations using localStorage
 * Simple local storage implementation without Supabase integration
 */
export class ProfileService {
    constructor() {
        // No external dependencies - just localStorage
    }

    /**
     * Complete user profile by storing in localStorage
     * @param {Object} profileData - Profile data to submit
     * @param {string} phoneNumber - User's WhatsApp phone number
     * @returns {Promise<Object>} Success response
     */
    async completeProfile(profileData, phoneNumber) {
        try {
            // Generate a simple ID for the profile
            const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            console.log('Creating profile with phone number:', phoneNumber);
            console.log('Generated profile ID:', profileId);

            // Create the complete profile object
            const completeProfile = {
                id: profileId,
                fullName: profileData.fullName,
                username: profileData.username,
                birthDate: profileData.birthDate,
                gender: profileData.gender,
                district: profileData.district,
                subCounty: profileData.subCounty || null,
                avatar: profileData.avatar || null,
                profilePhoto: profileData.profilePhoto || null,
                profilePhotoUrl: profileData.profilePhotoUrl || null,
                phoneNumber: phoneNumber,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            console.log('Storing profile in localStorage:', completeProfile);

            // Store in localStorage
            localStorage.setItem('netlife_profile', JSON.stringify(completeProfile));

            // Also store a backup
            localStorage.setItem('netlife_profile_backup', JSON.stringify(completeProfile));

            console.log('Profile stored successfully in localStorage');

            return {
                success: true,
                data: completeProfile,
                message: 'Profile created successfully'
            };
        } catch (error) {
            console.error('Error creating profile:', error);

            return {
                success: false,
                error: error.message || 'Failed to create profile'
            };
        }
    }

    /**
     * Check username availability (simple local check)
     * @param {string} username - Username to check
     * @returns {Promise<Object>} Availability result
     */
    async checkUsernameAvailability(username) {
        try {
            // Basic client-side validation
            if (!username || username.length < 3 || username.length > 30) {
                return {
                    available: false,
                    error: 'Username must be 3-30 characters long'
                };
            }

            // Check for valid characters (alphanumeric + underscore/hyphen)
            const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
            if (!validUsernameRegex.test(username)) {
                return {
                    available: false,
                    error: 'Username can only contain letters, numbers, underscore, or hyphen'
                };
            }

            // For localStorage implementation, assume username is available
            // (In a real app, you'd check against stored profiles)
            return { available: true };
        } catch (error) {
            console.error('Error checking username:', error);
            return {
                available: false,
                error: 'Unable to check username availability'
            };
        }
    }

    /**
     * Get list of districts (hardcoded fallback data)
     * @returns {Promise<Object>} Districts data
     */
    async getDistricts() {
        try {
            // Return hardcoded districts for localStorage implementation
            const districts = [
                { id: 1, name: 'Kampala', region: 'Central' },
                { id: 2, name: 'Wakiso', region: 'Central' },
                { id: 3, name: 'Mukono', region: 'Central' },
                { id: 4, name: 'Jinja', region: 'Eastern' },
                { id: 5, name: 'Mbale', region: 'Eastern' },
                { id: 6, name: 'Gulu', region: 'Northern' },
                { id: 7, name: 'Lira', region: 'Northern' },
                { id: 8, name: 'Mbarara', region: 'Western' },
                { id: 9, name: 'Fort Portal', region: 'Western' },
                { id: 10, name: 'Arua', region: 'Northern' },
                { id: 11, name: 'Masaka', region: 'Central' },
                { id: 12, name: 'Soroti', region: 'Eastern' }
            ];

            return {
                success: true,
                data: districts
            };
        } catch (error) {
            console.error('Error fetching districts:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }

    /**
     * Get sub counties for a specific district (hardcoded fallback data)
     * @param {number} districtId - District ID
     * @returns {Promise<Object>} Sub counties data
     */
    async getSubCounties(districtId) {
        try {
            // Return hardcoded sub counties for localStorage implementation
            const subCountiesMap = {
                1: [ // Kampala
                    { id: 1, name: 'Central Division', district_id: 1 },
                    { id: 2, name: 'Kawempe Division', district_id: 1 },
                    { id: 3, name: 'Makindye Division', district_id: 1 },
                    { id: 4, name: 'Nakawa Division', district_id: 1 },
                    { id: 5, name: 'Rubaga Division', district_id: 1 }
                ],
                2: [ // Wakiso
                    { id: 6, name: 'Entebbe', district_id: 2 },
                    { id: 7, name: 'Kira', district_id: 2 },
                    { id: 8, name: 'Nansana', district_id: 2 },
                    { id: 9, name: 'Makindye Ssabagabo', district_id: 2 }
                ],
                3: [ // Mukono
                    { id: 10, name: 'Mukono Town Council', district_id: 3 },
                    { id: 11, name: 'Lugazi', district_id: 3 },
                    { id: 12, name: 'Njeru', district_id: 3 }
                ]
            };

            const subCounties = subCountiesMap[districtId] || [];

            return {
                success: true,
                data: subCounties
            };
        } catch (error) {
            console.error('Error fetching sub counties:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }

    /**
     * Handle profile photo as base64 data URL (no external storage)
     * @param {File} file - Image file to process
     * @param {string} userId - User ID (not used in localStorage version)
     * @returns {Promise<Object>} Processing result
     */
    async uploadProfilePhoto(file, userId) {
        try {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
            }

            // Validate file size (5MB limit)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                throw new Error('File size too large. Please upload an image smaller than 5MB.');
            }

            // Convert to base64 data URL for localStorage
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        success: true,
                        url: reader.result, // base64 data URL
                        path: `local_${userId}_${Date.now()}`
                    });
                };
                reader.readAsDataURL(file);
            });
        } catch (error) {
            console.error('Error processing profile photo:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validate profile data before submission
     * @param {Object} profileData - Profile data to validate
     * @returns {Object} Validation result
     */
    validateProfileData(profileData) {
        const errors = {};

        // Full name validation
        if (!profileData.fullName || profileData.fullName.trim().length < 2) {
            errors.fullName = 'Full name must be at least 2 characters long';
        }

        // Username validation
        if (!profileData.username) {
            errors.username = 'Username is required';
        } else if (profileData.username.length < 3 || profileData.username.length > 30) {
            errors.username = 'Username must be 3-30 characters long';
        } else if (!/^[a-zA-Z0-9_-]+$/.test(profileData.username)) {
            errors.username = 'Username can only contain letters, numbers, underscore, or hyphen';
        }

        // Birth date validation
        if (!profileData.birthDate) {
            errors.birthDate = 'Birth date is required';
        } else {
            const birthDate = new Date(profileData.birthDate);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();

            if (birthDate > today) {
                errors.birthDate = 'Birth date cannot be in the future';
            } else if (age < 15) {
                errors.birthDate = 'You must be at least 15 years old to register';
            } else if (age > 120) {
                errors.birthDate = 'Please enter a valid birth date';
            }
        }

        // Gender validation
        if (!profileData.gender) {
            errors.gender = 'Gender is required';
        } else if (!['Male', 'Female', 'Other', 'Prefer not to say'].includes(profileData.gender)) {
            errors.gender = 'Please select a valid gender option';
        }

        // District validation
        if (!profileData.district) {
            errors.district = 'District is required';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    /**
     * Get user profile from localStorage
     * @param {string} userId - User ID (not used in localStorage version)
     * @returns {Promise<Object>} Profile data
     */
    async getProfile(userId) {
        try {
            const profileData = localStorage.getItem('netlife_profile');

            if (!profileData) {
                return {
                    success: false,
                    error: 'No profile found'
                };
            }

            const profile = JSON.parse(profileData);

            return {
                success: true,
                data: profile
            };
        } catch (error) {
            console.error('Error getting profile:', error);
            return {
                success: false,
                error: error.message || 'Failed to get profile'
            };
        }
    }

    /**
     * Handle API errors and provide user-friendly messages
     * @param {string} error - Error message
     * @returns {string} User-friendly error message
     */
    formatErrorMessage(error) {
        const errorMappings = {
            'Username must be 3-30 characters long and contain only letters, numbers, underscore, or hyphen': 'Please choose a username with 3-30 characters using only letters, numbers, underscore, or hyphen.',
            'This username is already taken. Please choose a different one.': 'This username is already taken. Please choose a different one.',
            'Required profile information is missing. Please fill all required fields.': 'Please fill in all required fields.',
            'Failed to create profile': 'Unable to save profile. Please try again.',
        };

        return errorMappings[error] || error || 'An unexpected error occurred. Please try again.';
    }
}

// Create and export a singleton instance
export const profileService = new ProfileService();
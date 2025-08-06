import { supabase } from '@/lib/supabase';

/**
 * ProfileService - Handles all profile-related API operations
 * Integrates with the backend WhatsApp authentication and profile management system
 */
export class ProfileService {
    constructor() {
        this.baseUrl = import.meta.env.VITE_SUPABASE_URL;
        this.anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    }

    /**
     * Complete user profile using the backend API
     * @param {Object} profileData - Profile data to submit
     * @param {string} userToken - JWT token from authentication
     * @returns {Promise<Object>} API response
     */
    async completeProfile(profileData, userToken) {
        try {
            // Map frontend field names to backend API format
            const apiData = {
                username: profileData.username,
                full_name: profileData.fullName,
                date_of_birth: profileData.birthDate,
                gender: profileData.gender.toLowerCase(), // API expects lowercase
                district: profileData.district,
                sub_county: profileData.subCounty || null,
                preferred_language: 'en' // Default to English
            };

            const response = await fetch(`${this.baseUrl}/functions/v1/complete-profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                },
                body: JSON.stringify(apiData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            return {
                success: true,
                data: result.profile,
                message: result.message
            };
        } catch (error) {
            console.error('Error completing profile:', error);
            return {
                success: false,
                error: error.message || 'Failed to complete profile'
            };
        }
    }

    /**
     * Check username availability by attempting to complete profile with test data
     * Note: The backend doesn't have a dedicated username check endpoint,
     * so we'll implement client-side validation and handle conflicts during submission
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

            // For now, assume username is available
            // Real validation will happen during profile completion
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
     * Get list of districts from the backend using REST API
     * Table name: districts
     * @returns {Promise<Object>} Districts data
     */
    async getDistricts() {
        try {
            console.log('Fetching districts from:', `${this.baseUrl}/rest/v1/districts?select=*`);

            const response = await fetch(`${this.baseUrl}/rest/v1/districts?select=*`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.anonKey}`,
                    'apikey': this.anonKey,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Districts response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Districts API error:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const districts = await response.json();
            console.log('Districts fetched successfully:', districts);

            // If API returns empty array, use fallback data
            if (!districts || districts.length === 0) {
                console.log('Districts table is empty, using fallback data');
                return {
                    success: false,
                    error: 'No districts found in database',
                    data: [
                        { id: 1, name: 'Kampala', region: 'Central' },
                        { id: 2, name: 'Wakiso', region: 'Central' },
                        { id: 3, name: 'Mukono', region: 'Central' },
                        { id: 4, name: 'Jinja', region: 'Eastern' },
                        { id: 5, name: 'Mbale', region: 'Eastern' },
                        { id: 6, name: 'Gulu', region: 'Northern' },
                        { id: 7, name: 'Lira', region: 'Northern' },
                        { id: 8, name: 'Mbarara', region: 'Western' },
                        { id: 9, name: 'Fort Portal', region: 'Western' }
                    ]
                };
            }

            return {
                success: true,
                data: districts.map(district => ({
                    id: district.id,
                    name: district.name,
                    region: district.region || 'Unknown'
                }))
            };
        } catch (error) {
            console.error('Error fetching districts:', error);
            // Fallback to hardcoded districts if API fails
            return {
                success: false,
                error: error.message,
                data: [
                    { id: 1, name: 'Kampala', region: 'Central' },
                    { id: 2, name: 'Wakiso', region: 'Central' },
                    { id: 3, name: 'Mukono', region: 'Central' },
                    { id: 4, name: 'Jinja', region: 'Eastern' },
                    { id: 5, name: 'Mbale', region: 'Eastern' },
                    { id: 6, name: 'Gulu', region: 'Northern' },
                    { id: 7, name: 'Lira', region: 'Northern' },
                    { id: 8, name: 'Mbarara', region: 'Western' },
                    { id: 9, name: 'Fort Portal', region: 'Western' }
                ]
            };
        }
    }

    /**
     * Get sub counties for a specific district using REST API
     * Table name: sub_counties (with underscore)
     * @param {number} districtId - District ID
     * @returns {Promise<Object>} Sub counties data
     */
    async getSubCounties(districtId) {
        try {
            console.log('Fetching sub counties for district ID:', districtId);
            const url = `${this.baseUrl}/rest/v1/sub_counties?select=*&district_id=eq.${districtId}`;
            console.log('Sub counties URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.anonKey}`,
                    'apikey': this.anonKey,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Sub counties response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Sub counties API error:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const subCounties = await response.json();
            console.log('Sub counties fetched successfully:', subCounties);

            return {
                success: true,
                data: subCounties.map(subCounty => ({
                    id: subCounty.id,
                    name: subCounty.name,
                    district_id: subCounty.district_id
                }))
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
     * Upload profile photo to Supabase Storage
     * Note: This uses the existing Supabase client for storage operations
     * @param {File} file - Image file to upload
     * @param {string} userId - User ID for file organization
     * @returns {Promise<Object>} Upload result
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

            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;

            const { data, error } = await supabase.storage
                .from('profile-photos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('profile-photos')
                .getPublicUrl(filePath);

            return {
                success: true,
                url: publicUrl,
                path: filePath
            };
        } catch (error) {
            console.error('Error uploading profile photo:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete profile photo from storage
     * @param {string} filePath - Path to the file in storage
     * @returns {Promise<Object>} Deletion result
     */
    async deleteProfilePhoto(filePath) {
        try {
            const { error } = await supabase.storage
                .from('profile-photos')
                .remove([filePath]);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Error deleting profile photo:', error);
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
        } else if (!['Male', 'Female', 'Other'].includes(profileData.gender)) {
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
     * Handle API errors and provide user-friendly messages
     * @param {string} error - Error message from API
     * @returns {string} User-friendly error message
     */
    formatErrorMessage(error) {
        const errorMappings = {
            'Username must be 3-30 characters long and contain only letters, numbers, underscore, or hyphen': 'Please choose a username with 3-30 characters using only letters, numbers, underscore, or hyphen.',
            'Username already exists': 'This username is already taken. Please choose a different one.',
            'Invalid or expired session': 'Your session has expired. Please log in again.',
            'Phone number must be in international format': 'Please enter a valid phone number.',
            'Profile already exists for this user': 'You already have a profile. Please contact support if you need to update it.'
        };

        return errorMappings[error] || error || 'An unexpected error occurred. Please try again.';
    }
}

// Create and export a singleton instance
export const profileService = new ProfileService();
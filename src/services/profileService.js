import { supabase } from '@/lib/supabase';

/**
 * ProfileService - Handles all profile-related API operations
 * Direct integration with Supabase database
 */
export class ProfileService {
    constructor() {
        this.baseUrl = import.meta.env.VITE_SUPABASE_URL;
        this.anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    }

    /**
     * Complete user profile by directly inserting into the profiles table
     * @param {Object} profileData - Profile data to submit
     * @param {Object} authSession - User's authentication session from WhatsApp verification
     * @returns {Promise<Object>} API response
     */
    async completeProfile(profileData, authSession) {
        try {
            // Set the user session in Supabase client for RLS authentication
            if (authSession && authSession.access_token) {
                console.log('Setting user session for authenticated request');
                await supabase.auth.setSession({
                    access_token: authSession.access_token,
                    refresh_token: authSession.refresh_token
                });
            } else {
                throw new Error('No valid authentication session found. Please log in again.');
            }

            // Get the current user to use their ID and phone number
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                console.error('Error getting authenticated user:', userError);
                throw new Error('Authentication failed. Please log in again.');
            }

            console.log('Authenticated user:', user);

            // Use the authenticated user's ID and phone number
            const dbData = {
                id: user.id, // Use the authenticated user's ID
                full_name: profileData.fullName,
                whatsapp_number: user.phone || user.user_metadata?.phone,
                username: profileData.username,
                date_of_birth: profileData.birthDate,
                gender: profileData.gender.toLowerCase(),
                district: profileData.district,
                sub_county: profileData.subCounty || null,
                profile_picture: profileData.profilePhotoUrl || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('Inserting profile data with authenticated user context:', dbData);

            // Insert directly into the profiles table with authenticated context
            const { data, error } = await supabase
                .from('profiles')
                .insert(dbData)
                .select()
                .single();

            if (error) {
                console.error('Supabase insert error:', error);

                // Handle specific database errors
                if (error.code === '23505' && error.message.includes('username')) {
                    throw new Error('This username is already taken. Please choose a different one.');
                }

                if (error.code === '23505') {
                    throw new Error('A profile with this information already exists.');
                }

                if (error.code === '23502') {
                    throw new Error('Required profile information is missing. Please fill all required fields.');
                }

                // Handle RLS policy violations
                if (error.message.includes('row-level security policy')) {
                    throw new Error('Authentication failed. Please log in again.');
                }

                throw new Error(error.message || 'Failed to create profile in database');
            }

            console.log('Profile created successfully in database:', data);

            return {
                success: true,
                data: data,
                message: 'Profile created successfully'
            };
        } catch (error) {
            console.error('Error creating profile:', error);
            console.error('Error type:', error.constructor.name);
            console.error('Error details:', error);

            return {
                success: false,
                error: error.message || 'Failed to create profile'
            };
        }
    }

    /**
     * Check username availability in the profiles table
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

            // Check database for existing username
            const { data, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .single();

            if (error && error.code === 'PGRST116') {
                // No rows returned - username is available
                return { available: true };
            }

            if (error) {
                console.error('Error checking username:', error);
                // If there's an error, assume username is available to not block user
                return { available: true };
            }

            // Username exists
            return {
                available: false,
                error: 'Username is already taken. Please choose another.'
            };
        } catch (error) {
            console.error('Error checking username:', error);
            // If there's an error, assume username is available to not block user
            return { available: true };
        }
    }

    /**
     * Get list of districts from the backend using REST API
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
     * Get user profile from the profiles table
     * @param {string} userId - User ID to get profile for
     * @returns {Promise<Object>} Profile data
     */
    async getProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error getting profile:', error);
                throw new Error(error.message);
            }

            return {
                success: true,
                data: data
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
     * Update profile photo URL in the profiles table
     * @param {string} userId - User ID
     * @param {string} photoUrl - Photo URL to update
     * @returns {Promise<Object>} Update result
     */
    async updateProfilePhoto(userId, photoUrl) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    profile_picture: photoUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                console.error('Error updating profile photo:', error);
                throw new Error(error.message);
            }

            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Error updating profile photo:', error);
            return {
                success: false,
                error: error.message || 'Failed to update profile photo'
            };
        }
    }

    /**
     * Handle API errors and provide user-friendly messages
     * @param {string} error - Error message from API
     * @returns {string} User-friendly error message
     */
    formatErrorMessage(error) {
        const errorMappings = {
            'Username must be 3-30 characters long and contain only letters, numbers, underscore, or hyphen': 'Please choose a username with 3-30 characters using only letters, numbers, underscore, or hyphen.',
            'This username is already taken. Please choose a different one.': 'This username is already taken. Please choose a different one.',
            'A profile with this information already exists.': 'A profile with this information already exists.',
            'Required profile information is missing. Please fill all required fields.': 'Please fill in all required fields.',
            'Failed to create profile in database': 'Unable to save profile. Please try again.',
        };

        return errorMappings[error] || error || 'An unexpected error occurred. Please try again.';
    }
}

// Create and export a singleton instance
export const profileService = new ProfileService();
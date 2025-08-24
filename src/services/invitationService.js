/**
 * Invitation Service
 * Handles user invitation functionality including referral codes and WhatsApp sharing
 */

import { supabase } from '@/lib/supabase';

class InvitationService {
    /**
     * Generate a unique referral code for a user
     * @param {string} userId - The user's ID
     * @returns {string} - Unique referral code
     */
    generateReferralCode(userId) {
        // Create a short, unique code based on user ID
        const timestamp = Date.now().toString(36);
        const userIdHash = userId.slice(-6);
        return `NL${userIdHash}${timestamp}`.toUpperCase();
    }

    /**
     * Get or create user referral data
     * @param {string} userId - The user's ID
     * @returns {Promise<Object>} - Referral data
     */
    async getUserReferralData(userId) {
        try {
            // Check if user already has referral data
            const { data: existingReferral, error: fetchError } = await supabase
                .from('user_referrals')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            if (existingReferral) {
                return { success: true, data: existingReferral };
            }

            // Create new referral data
            const referralCode = this.generateReferralCode(userId);
            const { data: newReferral, error: insertError } = await supabase
                .from('user_referrals')
                .insert({
                    user_id: userId,
                    referral_code: referralCode,
                    total_invites: 0,
                    successful_invites: 0
                })
                .select()
                .single();

            if (insertError) {
                throw insertError;
            }

            return { success: true, data: newReferral };
        } catch (error) {
            console.error('Error getting user referral data:', error);
            return { success: false, error };
        }
    }

    /**
     * Track a new invitation
     * @param {string} inviterId - The user sending the invitation
     * @param {string} inviteePhone - The phone number being invited
     * @returns {Promise<Object>} - Invitation data
     */
    async trackInvitation(inviterId, inviteePhone) {
        try {
            const { data, error } = await supabase
                .from('invitations')
                .insert({
                    inviter_id: inviterId,
                    invitee_phone: inviteePhone,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            // Update total invites count
            await this.updateInviteCount(inviterId, 'total');

            return { success: true, data };
        } catch (error) {
            console.error('Error tracking invitation:', error);
            return { success: false, error };
        }
    }

    /**
     * Update invitation count for a user
     * @param {string} userId - The user's ID
     * @param {string} type - 'total' or 'successful'
     * @returns {Promise<Object>} - Update result
     */
    async updateInviteCount(userId, type) {
        try {
            // First get current count
            const { data: currentData, error: fetchError } = await supabase
                .from('user_referrals')
                .select(type === 'total' ? 'total_invites' : 'successful_invites')
                .eq('user_id', userId)
                .single();

            if (fetchError) {
                throw fetchError;
            }

            const currentCount = currentData[type === 'total' ? 'total_invites' : 'successful_invites'] || 0;
            const newCount = currentCount + 1;

            // Update with new count
            const { data, error } = await supabase
                .from('user_referrals')
                .update({
                    [type === 'total' ? 'total_invites' : 'successful_invites']: newCount
                })
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error updating invite count:', error);
            return { success: false, error };
        }
    }

    /**
     * Get invitation statistics for a user
     * @param {string} userId - The user's ID
     * @returns {Promise<Object>} - Invitation statistics
     */
    async getInvitationStats(userId) {
        try {
            const { data: referralData, error: referralError } = await supabase
                .from('user_referrals')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (referralError) {
                throw referralError;
            }

            const { data: recentInvitations, error: invitationsError } = await supabase
                .from('invitations')
                .select('*')
                .eq('inviter_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (invitationsError) {
                throw invitationsError;
            }

            return {
                success: true,
                data: {
                    referralData,
                    recentInvitations
                }
            };
        } catch (error) {
            console.error('Error getting invitation stats:', error);
            return { success: false, error };
        }
    }

    /**
     * Generate invitation link
     * @param {string} referralCode - The user's referral code
     * @returns {string} - Complete invitation link
     */
    generateInvitationLink(referralCode) {
        const baseUrl = window.location.origin;
        return `${baseUrl}/welcome?ref=${referralCode}`;
    }

    /**
     * Generate WhatsApp sharing URL
     * @param {string} referralCode - The user's referral code
     * @param {string} message - Custom message
     * @returns {string} - WhatsApp sharing URL
     */
    generateWhatsAppUrl(referralCode, message = '') {
        const invitationLink = this.generateInvitationLink(referralCode);
        const defaultMessage = "Join me on NetLife! A safe space for health and wellness. Download the app and use my referral code for exclusive benefits.";
        const fullMessage = message || defaultMessage;

        const encodedMessage = encodeURIComponent(`${fullMessage}\n\n${invitationLink}`);
        return `https://wa.me/?text=${encodedMessage}`;
    }

    /**
     * Copy invitation link to clipboard
     * @param {string} referralCode - The user's referral code
     * @returns {Promise<boolean>} - Success status
     */
    async copyInvitationLink(referralCode) {
        try {
            const invitationLink = this.generateInvitationLink(referralCode);
            await navigator.clipboard.writeText(invitationLink);
            return true;
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            return false;
        }
    }

    /**
     * Share via WhatsApp
     * @param {string} referralCode - The user's referral code
     * @param {string} message - Custom message
     * @returns {void}
     */
    shareViaWhatsApp(referralCode, message = '') {
        const whatsappUrl = this.generateWhatsAppUrl(referralCode, message);
        window.open(whatsappUrl, '_blank');
    }

    /**
     * Validate referral code
     * @param {string} referralCode - The referral code to validate
     * @returns {Promise<Object>} - Validation result
     */
    async validateReferralCode(referralCode) {
        try {
            const { data, error } = await supabase
                .from('user_referrals')
                .select('user_id, referral_code')
                .eq('referral_code', referralCode)
                .single();

            if (error) {
                return { success: false, error: 'Invalid referral code' };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error validating referral code:', error);
            return { success: false, error: 'Invalid referral code' };
        }
    }

    /**
     * Process successful invitation (when new user signs up with referral code)
     * @param {string} referralCode - The referral code used
     * @param {string} newUserId - The new user's ID
     * @returns {Promise<Object>} - Processing result
     */
    async processSuccessfulInvitation(referralCode, newUserId) {
        try {
            // Find the referrer
            const { data: referrerData, error: referrerError } = await supabase
                .from('user_referrals')
                .select('user_id')
                .eq('referral_code', referralCode)
                .single();

            if (referrerError) {
                throw referrerError;
            }

            // Update successful invites count
            await this.updateInviteCount(referrerData.user_id, 'successful');

            // Update invitation status
            const { error: updateError } = await supabase
                .from('invitations')
                .update({
                    status: 'accepted',
                    accepted_at: new Date().toISOString()
                })
                .eq('inviter_id', referrerData.user_id)
                .eq('status', 'pending');

            if (updateError) {
                throw updateError;
            }

            return { success: true };
        } catch (error) {
            console.error('Error processing successful invitation:', error);
            return { success: false, error };
        }
    }

    /**
 * Process referral code during signup
 * @param {string} referralCode - The referral code from URL
 * @param {string} newUserId - The new user's ID
 * @returns {Promise<Object>} - Processing result
 */
    async processReferralCode(referralCode, newUserId) {
        try {
            // Validate the referral code
            const { success: isValid, data: referrerData } = await this.validateReferralCode(referralCode);

            if (!isValid || !referrerData) {
                return { success: false, error: 'Invalid referral code' };
            }

            // Update successful invites count for the referrer
            await this.updateInviteCount(referrerData.user_id, 'successful');

            // Store the referral relationship (using existing invitation record or create new one)
            const { data, error } = await supabase
                .from('invitations')
                .insert({
                    inviter_id: referrerData.user_id,
                    invitee_phone: null, // Will be updated when user completes profile
                    status: 'accepted',
                    accepted_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error processing referral code:', error);
            return { success: false, error };
        }
    }

    /**
     * Process invitation status update (e.g., when user completes profile)
     * @param {string} inviterId - The user sending the invitation
     * @param {string} inviteePhone - The phone number of the invitee
     * @param {string} status - 'pending', 'accepted', 'expired'
     * @returns {Promise<Object>} - Update result
     */
    async updateInvitationStatus(inviterId, inviteePhone, status) {
        try {
            const { error } = await supabase
                .from('invitations')
                .update({
                    status,
                    accepted_at: status === 'accepted' ? new Date().toISOString() : null
                })
                .eq('inviter_id', inviterId)
                .eq('invitee_phone', inviteePhone)
                .eq('status', 'pending');

            if (error) {
                throw error;
            }

            return { success: true };
        } catch (error) {
            console.error('Error updating invitation status:', error);
            return { success: false, error };
        }
    }
}

export const invitationService = new InvitationService();

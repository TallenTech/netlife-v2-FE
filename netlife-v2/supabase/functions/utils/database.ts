import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface LoginCode {
    phone_number: string;
    code: string;
    expires_at: string;
    verified: boolean;
}

export interface DatabaseConfig {
    supabaseUrl: string;
    supabaseServiceKey: string;
}

/**
 * Database service for OTP management
 * Handles all database operations for login codes
 */
export class OTPDatabaseService {
    private supabase: SupabaseClient;

    constructor(config: DatabaseConfig) {
        this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    }

    /**
     * Store a new OTP code in the database
     * Replaces any existing code for the same phone number
     */
    async storeOTP(phone: string, code: string, expiryMinutes: number = 10): Promise<void> {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

        const { error } = await this.supabase
            .from('login_codes')
            .upsert({
                phone_number: phone,
                code: code,
                expires_at: expiresAt.toISOString(),
                verified: false
            }, {
                onConflict: 'phone_number'
            });

        if (error) {
            throw new Error(`Failed to store OTP: ${error.message}`);
        }
    }

    /**
     * Retrieve and validate an OTP code from the database
     */
    async getOTP(phone: string): Promise<LoginCode | null> {
        const { data, error } = await this.supabase
            .from('login_codes')
            .select('*')
            .eq('phone_number', phone)
            .eq('verified', false)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned
                return null;
            }
            throw new Error(`Failed to retrieve OTP: ${error.message}`);
        }

        return data;
    }

    /**
     * Check if there's an active (non-expired, non-verified) OTP for a phone number
     */
    async hasActiveOTP(phone: string): Promise<boolean> {
        const now = new Date().toISOString();

        const { data, error } = await this.supabase
            .from('login_codes')
            .select('phone_number')
            .eq('phone_number', phone)
            .eq('verified', false)
            .gt('expires_at', now)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No active OTP found
                return false;
            }
            throw new Error(`Failed to check active OTP: ${error.message}`);
        }

        return data !== null;
    }

    /**
     * Mark an OTP code as verified
     */
    async markAsVerified(phone: string): Promise<void> {
        const { error } = await this.supabase
            .from('login_codes')
            .update({ verified: true })
            .eq('phone_number', phone);

        if (error) {
            throw new Error(`Failed to mark OTP as verified: ${error.message}`);
        }
    }

    /**
     * Delete an OTP code (cleanup after failed send or verification)
     */
    async deleteOTP(phone: string): Promise<void> {
        const { error } = await this.supabase
            .from('login_codes')
            .delete()
            .eq('phone_number', phone);

        if (error) {
            throw new Error(`Failed to delete OTP: ${error.message}`);
        }
    }

    /**
     * Clean up expired OTP codes
     */
    async cleanupExpiredOTPs(): Promise<number> {
        const now = new Date().toISOString();

        const { data, error } = await this.supabase
            .from('login_codes')
            .delete()
            .lt('expires_at', now);

        if (error) {
            throw new Error(`Failed to cleanup expired OTPs: ${error.message}`);
        }

        return data?.length || 0;
    }
}
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
})

// WhatsApp authentication functions matching the API documentation
export const whatsappAuth = {
    // Send verification code
    async sendCode(phone) {
        try {
            const { data, error } = await supabase.functions.invoke('send-code', {
                body: { phone }
            })

            if (error) throw error
            return { success: true, ...data }
        } catch (error) {
            console.error('Error sending code:', error)
            return { success: false, error: error.message }
        }
    },

    // Verify code and authenticate user
    async verifyCode(phone, code) {
        try {
            const { data, error } = await supabase.functions.invoke('verify-code', {
                body: { phone, code }
            })

            if (error) throw error
            return { success: true, ...data }
        } catch (error) {
            console.error('Error verifying code:', error)
            return { success: false, error: error.message }
        }
    },

    // Complete user profile
    async completeProfile(profileData) {
        try {
            const { data, error } = await supabase.functions.invoke('complete-profile', {
                body: profileData
            })

            if (error) throw error
            return { success: true, ...data }
        } catch (error) {
            console.error('Error completing profile:', error)
            return { success: false, error: error.message }
        }
    }
}

// Reference data functions
export const referenceData = {
    // Get all districts
    async getDistricts() {
        try {
            const { data, error } = await supabase
                .from('districts')
                .select('*')
                .order('name')

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Error fetching districts:', error)
            return { success: false, error: error.message, data: [] }
        }
    },

    // Get sub counties by district ID
    async getSubCounties(districtId) {
        try {
            const { data, error } = await supabase
                .from('sub_counties')
                .select('*')
                .eq('district_id', districtId)
                .order('name')

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Error fetching sub counties:', error)
            return { success: false, error: error.message, data: [] }
        }
    }
}

// Utility functions for session management
export const authUtils = {
    // Get current session
    async getCurrentSession() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession()
            if (error) throw error
            return session
        } catch (error) {
            console.error('Error getting session:', error)
            return null
        }
    },

    // Get current user
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error) throw error
            return user
        } catch (error) {
            console.error('Error getting user:', error)
            return null
        }
    },

    // Sign out user
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            return { success: true }
        } catch (error) {
            console.error('Error signing out:', error)
            return { success: false, error: error.message }
        }
    },

    // Listen to auth state changes
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback)
    }
}

// Export default client for direct access if needed
export default supabase
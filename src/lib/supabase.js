import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Debug environment variables
// console.log("🔍 Supabase Environment Check:");
// console.log("URL:", supabaseUrl || "NOT SET");
// console.log(
//     "Key:",
//     supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "NOT SET"
// );
// console.log("All env vars:", import.meta.env);

// Check if environment variables are properly configured
const isSupabaseConfigured =
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "your_supabase_project_url_here" &&
    supabaseAnonKey !== "your_supabase_anon_key_here" &&
    supabaseUrl.includes("supabase.co") &&
    supabaseAnonKey.startsWith("eyJ");

console.log("✅ Supabase configured:", isSupabaseConfigured);

// If environment variables are not working, try direct values for debugging
const fallbackUrl = "your_supabase_project_url_here";
const fallbackKey = "your_supabase_anon_key_here";

const finalUrl = supabaseUrl || fallbackUrl;
const finalKey = supabaseAnonKey || fallbackKey;

// console.log("🔧 Using URL:", finalUrl);
// console.log(
//     "🔧 Using Key:",
//     finalKey ? `${finalKey.substring(0, 20)}...` : "NOT SET"
// );

// Create mock client for development when Supabase is not configured
const createMockClient = () => ({
    from: () => ({
        select: () => ({
            order: () =>
                Promise.resolve({
                    data: [],
                    error: new Error("Supabase not configured"),
                }),
        }),
        insert: () =>
            Promise.resolve({ error: new Error("Supabase not configured") }),
        eq: () => ({
            order: () =>
                Promise.resolve({
                    data: [],
                    error: new Error("Supabase not configured"),
                }),
        }),
    }),
    auth: {
        getUser: () =>
            Promise.resolve({
                data: { user: null },
                error: new Error("Supabase not configured"),
            }),
        getSession: () =>
            Promise.resolve({
                data: { session: null },
                error: new Error("Supabase not configured"),
            }),
        signOut: () =>
            Promise.resolve({ error: new Error("Supabase not configured") }),
    },
});

// Always try to create a real client first
let supabase;
try {
    console.log("🚀 Creating Supabase client...");
    supabase = createClient(finalUrl, finalKey);
    console.log("✅ Supabase client created successfully");
} catch (error) {
    console.error("❌ Failed to create Supabase client:", error);
    supabase = createMockClient();
}

export { supabase };

// Export auth utilities
export const authUtils = {
    getCurrentSession: async () => {
        const {
            data: { session },
            error,
        } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    },

    getCurrentUser: async () => {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    },

    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },
};

// Export test function for debugging
export const testDirectConnection = async () => {
    console.log("🧪 Testing direct Supabase connection...");
    console.log("🔍 Client type:", typeof supabase.from);

    try {
        // Test if we can make a simple query to fetch services
        const result = await supabase
            .from("services")
            .select("id, name, description")
            .limit(5);

        console.log("📊 Query result:", result);

        if (result.error) {
            console.error("❌ Direct connection failed:", result.error);
            return { success: false, error: result.error.message };
        }

        console.log(
            "✅ Direct connection successful, found",
            result.data?.length || 0,
            "services"
        );
        return { success: true, data: result.data };
    } catch (err) {
        console.error("❌ Direct connection error:", err);
        return { success: false, error: err.message };
    }
};

// Make test available globally for debugging
if (typeof window !== "undefined") {
    window.testSupabaseConnection = testDirectConnection;
    window.supabaseClient = supabase;
}

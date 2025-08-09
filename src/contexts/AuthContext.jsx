import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (authUser) => {
    if (!authUser) return null;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === "INITIAL_SESSION") {
        setIsLoading(true);
      }

      setSession(newSession);
      const authUser = newSession?.user || null;
      setUser(authUser);

      if (authUser) {
        const userProfile = await fetchUserProfile(authUser);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    const authUser = (await supabase.auth.getUser()).data.user;
    if (authUser) {
      const userProfile = await fetchUserProfile(authUser);
      setProfile(userProfile);
    }
    setIsLoading(false);
  }, [fetchUserProfile]);

  const value = {
    user,
    profile,
    isAuthenticated: !!user && !!profile,
    isPartiallyAuthenticated: !!user && !profile,
    isLoading,
    logout: () => supabase.auth.signOut(),
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

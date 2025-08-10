import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/services/profileService";
import { getCachedUserData, setCachedUserData } from "@/lib/cache";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [managedProfiles, setManagedProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const authUser = session?.user ?? null;
      setUser(authUser);
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchFullUserData = useCallback(async () => {
    try {
      const { success, data, error } = await profileService.getUserData();
      if (!success) throw error;

      const { mainProfile, managedProfiles: dependents } = data;
      setCachedUserData(mainProfile, dependents);
      setProfile(mainProfile);
      setManagedProfiles(dependents || []);

      const lastActiveProfileId = localStorage.getItem(
        "netlife_active_profile_id"
      );
      const lastActive = (dependents || []).find(
        (p) => p.id === lastActiveProfileId
      );
      setActiveProfile(lastActive || mainProfile);
    } catch (e) {
      console.error("Background sync failed:", e);
    }
  }, []);

  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      fetchFullUserData();
    } else {
      setProfile(null);
      setManagedProfiles([]);
      setActiveProfile(null);
    }
  }, [user, fetchFullUserData]);

  const refreshSession = useCallback(async () => {
    const { data } = await supabase.auth.refreshSession();
    if (data.user) {
      setUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    
    // Clear only auth-related data, preserve user history and records
    const keysToRemove = [
      'netlife_active_profile_id',
      'netlife_cached_user_data',
      'netlife_language'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Note: We preserve service_request_*, netlife_health_survey_*, and screening_results_* 
    // so users don't lose their history when they log out and back in
  }, []);

  const switchActiveProfile = useCallback(
    (profileId) => {
      let newActiveProfile = null;
      if (profileId === profile?.id) {
        newActiveProfile = profile;
      } else {
        newActiveProfile = managedProfiles.find((p) => p.id === profileId);
      }
      if (newActiveProfile) {
        setActiveProfile(newActiveProfile);
        localStorage.setItem("netlife_active_profile_id", newActiveProfile.id);
      }
    },
    [profile, managedProfiles]
  );

  const refreshAuthAndProfiles = useCallback(async () => {
    if (user) {
      await fetchFullUserData();
    }
  }, [user, fetchFullUserData]);

  const updateProfile = useCallback(
    async (dataToUpdate) => {
      if (!activeProfile || !user)
        throw new Error("No active profile selected");
      try {
        if (activeProfile.id === profile.id) {
          await supabase
            .from("profiles")
            .update(dataToUpdate)
            .eq("id", user.id);
        } else {
          await profileService.updateManagedProfile(
            activeProfile.id,
            dataToUpdate
          );
        }
        await refreshAuthAndProfiles();
      } catch (e) {
        console.error("Profile update failed:", e);
        throw e;
      }
    },
    [user, profile, activeProfile, refreshAuthAndProfiles]
  );

  const value = {
    user,
    session,
    profile,
    managedProfiles,
    activeProfile,
    isLoading,
    error,
    isAuthenticated: !!user?.user_metadata?.display_name,
    isPartiallyAuthenticated: !!user && !user?.user_metadata?.display_name,
    logout,
    fetchManagedProfiles: refreshAuthAndProfiles,
    switchActiveProfile,
    updateProfile,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

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
    const cachedData = getCachedUserData();
    if (cachedData?.profile) {
      setProfile(cachedData.profile);
      setManagedProfiles(cachedData.managedProfiles || []);
      const lastActiveProfileId = localStorage.getItem(
        "netlife_active_profile_id"
      );
      const lastActive = (cachedData.managedProfiles || []).find(
        (p) => p.id === lastActiveProfileId
      );
      setActiveProfile(lastActive || cachedData.profile);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const syncWithServer = useCallback(async (authUser) => {
    try {
      const { success, data, error } = await profileService.getUserData();
      if (!success) throw error;

      const { mainProfile, managedProfiles: dependents } = data;

      if (mainProfile) {
        setCachedUserData(mainProfile, dependents);
        setProfile(mainProfile);
        setManagedProfiles(dependents || []);

        const lastActiveProfileId = localStorage.getItem(
          "netlife_active_profile_id"
        );
        const currentActiveIsValid = [mainProfile, ...(dependents || [])].some(
          (p) => p.id === lastActiveProfileId
        );

        if (currentActiveIsValid) {
          const lastActive = (dependents || []).find(
            (p) => p.id === lastActiveProfileId
          );
          setActiveProfile(lastActive || mainProfile);
        } else {
          setActiveProfile(mainProfile);
        }
      } else {
        setProfile(null);
        setActiveProfile(null);
      }
    } catch (e) {
      console.error("Failed to sync with server:", e);
      setError(e);
    }
  }, []);

  useEffect(() => {
    if (user) {
      syncWithServer(user);
    } else {
      localStorage.clear();
      setProfile(null);
      setManagedProfiles([]);
      setActiveProfile(null);
    }
  }, [user, syncWithServer]);

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
      await syncWithServer(user);
    }
  }, [user, syncWithServer]);

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

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = {
    user,
    session,
    profile,
    managedProfiles,
    activeProfile,
    isLoading,
    error,
    isAuthenticated: !!user && !!activeProfile,
    isPartiallyAuthenticated: !!user && !profile,
    logout,
    fetchManagedProfiles: refreshAuthAndProfiles,
    switchActiveProfile,
    updateProfile,
    refreshSession: refreshAuthAndProfiles,
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

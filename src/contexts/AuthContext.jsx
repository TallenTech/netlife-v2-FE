import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/services/profileService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [managedProfiles, setManagedProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchManagedProfiles = useCallback(async (managerId) => {
    if (!managerId) return [];
    try {
      const { data, error } = await supabase
        .from("managed_profiles")
        .select("*")
        .eq("manager_id", managerId);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching managed profiles:", error);
      return [];
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();
        if (initialSession) {
          const authUser = initialSession.user;
          setSession(initialSession);
          setUser(authUser);

          const { data: mainProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single();
          const dependents = await fetchManagedProfiles(authUser.id);

          setProfile(mainProfile);
          setManagedProfiles(dependents);

          const lastActiveProfileId = localStorage.getItem(
            "netlife_active_profile_id"
          );
          const lastActive = dependents.find(
            (p) => p.id === lastActiveProfileId
          );
          setActiveProfile(lastActive || mainProfile);
        }
      } catch (e) {
        console.error("Error in initial auth setup:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === "SIGNED_IN") {
        setSession(newSession);
        const authUser = newSession.user;
        setUser(authUser);
        const { data: mainProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();
        const dependents = await fetchManagedProfiles(authUser.id);
        setProfile(mainProfile);
        setManagedProfiles(dependents);
        setActiveProfile(mainProfile);
      } else if (event === "SIGNED_OUT") {
        localStorage.removeItem("netlife_active_profile_id");
        setSession(null);
        setUser(null);
        setProfile(null);
        setManagedProfiles([]);
        setActiveProfile(null);
      } else if (event === "USER_UPDATED") {
        if (newSession) setUser(newSession.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchManagedProfiles]);

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
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      const { data: mainProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();
      const dependents = await fetchManagedProfiles(authUser.id);
      setProfile(mainProfile);
      setManagedProfiles(dependents);
    }
  }, [fetchManagedProfiles]);

  const updateProfile = useCallback(
    async (dataToUpdate) => {
      if (!activeProfile || !user)
        throw new Error("No active profile selected.");
      let updatedProfile;
      if (activeProfile.id === profile.id) {
        const { data, error } = await supabase
          .from("profiles")
          .update(dataToUpdate)
          .eq("id", user.id)
          .select()
          .single();
        if (error) throw error;
        updatedProfile = data;
        setProfile(updatedProfile);
      } else {
        const { success, data, error } =
          await profileService.updateManagedProfile(
            activeProfile.id,
            dataToUpdate
          );
        if (!success) throw new Error(error.message);
        updatedProfile = data;
      }
      await refreshAuthAndProfiles();
      setActiveProfile(updatedProfile);
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
    isAuthenticated: !!user && !!activeProfile,
    isPartiallyAuthenticated: !!user && !profile,
    logout: () => supabase.auth.signOut(),
    fetchManagedProfiles: refreshAuthAndProfiles,
    switchActiveProfile,
    updateProfile,
    refreshSession: refreshAuthAndProfiles,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

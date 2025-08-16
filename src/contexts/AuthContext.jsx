import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/services/profileService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  
  const queryClient = useQueryClient();

  const { 
    data: userData, 
    isLoading: isLoadingProfile, 
    error: profileError 
  } = useQuery({
    queryKey: ['userData', user?.id],
    queryFn: async () => {
      if (!user?.user_metadata?.display_name) return null;
      
      const { success, data, error } = await profileService.getUserData();
      if (!success) throw error;
      return data;
    },
    enabled: !!user?.user_metadata?.display_name,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 60,
  });

  const profile = userData?.mainProfile;
  const managedProfiles = userData?.managedProfiles || [];
  const activeProfile = managedProfiles.find(p => p.id === activeProfileId) || profile;
  
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoadingSession(false);

      if (!session) {
        queryClient.removeQueries({ queryKey: ['userData'] });
      }
    });

    return () => subscription?.unsubscribe();
  }, [queryClient]);

  useEffect(() => {
    const lastActiveId = localStorage.getItem("netlife_active_profile_id");
    if (lastActiveId) {
      setActiveProfileId(lastActiveId);
    } else if (profile) {
      setActiveProfileId(profile.id);
    }
  }, [profile]);

  const switchActiveProfile = useCallback((profileId) => {
    setActiveProfileId(profileId);
    localStorage.setItem("netlife_active_profile_id", profileId);
  }, []);

  const { mutateAsync: updateProfileMutation } = useMutation({
    mutationFn: async (dataToUpdate) => {
      if (!activeProfile) throw new Error("No active profile selected");

      if (activeProfile.id === profile?.id) {
        return profileService.upsertProfile(dataToUpdate, user.id);
      } else {
        return profileService.updateManagedProfile(activeProfile.id, dataToUpdate);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userData', user?.id] });
    },
  });

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("netlife_active_profile_id");
  }, []);
  
  const value = {
    user,
    session,
    profile,
    managedProfiles,
    activeProfile,
    isLoading: isLoadingSession || (!!user && isLoadingProfile),
    error: profileError,
    isAuthenticated: !!user?.user_metadata?.display_name,
    isPartiallyAuthenticated: !!user && !user?.user_metadata?.display_name,
    logout,
    switchActiveProfile,
    updateProfile: updateProfileMutation,
    refreshAuthAndProfiles: () => queryClient.invalidateQueries({ queryKey: ['userData', user?.id] }),
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
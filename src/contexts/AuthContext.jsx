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
import { invitationService } from "@/services/invitationService";
import useAutoLogout from "@/hooks/useAutoLogout";
import { getAutoLogoutConfig } from "@/config/autoLogout";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [user, setUser] = useState(undefined);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Process referral code when user signs up
      if (_event === "SIGNED_IN" && session?.user) {
        const storedReferralCode = localStorage.getItem('netlife_referral_code');
        if (storedReferralCode) {
          try {
            await invitationService.processReferralCode(storedReferralCode, session.user.id);
            localStorage.removeItem('netlife_referral_code');
          } catch (error) {
            console.error('Error processing referral code:', error);
          }
        }
      }

      if (_event === "SIGNED_OUT") {
        queryClient.clear();
        localStorage.removeItem("netlife_active_profile_id");
      }
    });

    return () => subscription?.unsubscribe();
  }, [queryClient]);

  const {
    data: userData,
    error: profileError,
    isInitialLoading: isProfileInitialLoading,
  } = useQuery({
    queryKey: ["userData", user?.id],
    queryFn: async () => {
      if (!user?.user_metadata?.display_name) return null;
      const { success, data, error } = await profileService.getUserData();
      if (!success) throw error;
      return data;
    },
    enabled: !!user && !!user.user_metadata?.display_name,
    staleTime: 1000 * 60 * 5,
  });

  const profile = userData?.mainProfile;
  const managedProfiles = userData?.managedProfiles || [];

  useEffect(() => {
    const lastActiveId = localStorage.getItem("netlife_active_profile_id");
    if (lastActiveId) {
      setActiveProfileId(lastActiveId);
    } else if (profile) {
      setActiveProfileId(profile.id);
    }
  }, [profile]);

  const activeProfile =
    managedProfiles.find((p) => p.id === activeProfileId) || profile;

  const switchActiveProfile = useCallback((profileId) => {
    setActiveProfileId(profileId);
    localStorage.setItem("netlife_active_profile_id", profileId);
  }, []);

  const { mutateAsync: updateProfileMutation } = useMutation({
    mutationFn: async (dataToUpdate) => {
      if (!activeProfile) throw new Error("No active profile selected");
      if (activeProfile.id === profile?.id) {
        return profileService.updateMainProfile(user.id, dataToUpdate);
      } else {
        return profileService.updateManagedProfile(
          activeProfile.id,
          dataToUpdate
        );
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["userData", user?.id] });
      if (result?.success && result?.data) {
        queryClient.setQueryData(["userData", user?.id], (oldData) => {
          if (!oldData) return oldData;
          if (activeProfile?.id === profile?.id) {
            return {
              ...oldData,
              mainProfile: { ...oldData.mainProfile, ...result.data },
            };
          } else {
            return {
              ...oldData,
              managedProfiles:
                oldData.managedProfiles?.map((p) =>
                  p.id === activeProfile?.id ? { ...p, ...result.data } : p
                ) || [],
            };
          }
        });
      }
    },
  });

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const isAuthenticated = !!user?.user_metadata?.display_name;
  const isPartiallyAuthenticated = !!user && !user?.user_metadata?.display_name;
  const isLoading =
    user === undefined || (isAuthenticated && isProfileInitialLoading);

  const autoLogoutConfig = getAutoLogoutConfig();
  useAutoLogout(logout, isAuthenticated, autoLogoutConfig);

  const value = {
    user,
    session,
    profile,
    managedProfiles,
    activeProfile,
    isLoading,
    error: profileError,
    isAuthenticated,
    isPartiallyAuthenticated,
    logout,
    switchActiveProfile,
    updateProfile: updateProfileMutation,
    refreshAuthAndProfiles: () =>
      queryClient.invalidateQueries({ queryKey: ["userData", user?.id] }),
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

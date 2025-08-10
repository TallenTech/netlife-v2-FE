import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "@/contexts/AuthContext";

const UserDataContext = createContext(null);

export const useUserData = () => useContext(UserDataContext);

export const UserDataProvider = ({ children }) => {
  const { profile } = useAuth();
  const [activeProfileId, setActiveProfileId] = useState("main");

  useEffect(() => {
    const storedActiveProfileId = localStorage.getItem(
      "netlife_active_profile_id"
    );
    if (storedActiveProfileId) {
      setActiveProfileId(storedActiveProfileId);
    }
  }, []);

  const updateUserData = useCallback((newProfileData) => {
    console.log(
      "updateUserData called. Profile is managed by AuthContext.",
      newProfileData
    );
  }, []);

  const switchProfile = (profileId) => {
    setActiveProfileId(profileId);
    localStorage.setItem("netlife_active_profile_id", profileId);
  };

  const activeProfile = useMemo(() => {
    if (!profile) return null;
    if (activeProfileId === "main") {
      return { ...profile, id: "main", isMain: true };
    }

    const dependent = profile.dependents?.find((d) => d.id === activeProfileId);
    return dependent
      ? { ...dependent, isMain: false }
      : { ...profile, id: "main", isMain: true };
  }, [profile, activeProfileId]);

  const allProfiles = useMemo(() => {
    if (!profile) return [];
    return [
      { ...profile, id: "main", isMain: true },
      ...(profile.dependents || []),
    ];
  }, [profile]);

  const value = {
    userData: profile,
    updateUserData,
    activeProfileId,
    switchProfile,
    activeProfile,
    allProfiles,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};
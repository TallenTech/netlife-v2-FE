import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const UserDataContext = createContext();

export const useUserData = () => useContext(UserDataContext);

export const UserDataProvider = ({ children }) => {
  const { isAuthenticated, user: authUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [activeProfileId, setActiveProfileId] = useState('main');
  
  useEffect(() => {
    if (isAuthenticated && authUser) {
      setUserData(authUser);
      const storedActiveProfileId = localStorage.getItem('netlife_active_profile_id');
      if (storedActiveProfileId && (storedActiveProfileId === 'main' || authUser.dependents?.some(d => d.id === storedActiveProfileId))) {
        setActiveProfileId(storedActiveProfileId);
      } else {
        setActiveProfileId('main');
        localStorage.setItem('netlife_active_profile_id', 'main');
      }
    } else {
      setUserData(null);
      setActiveProfileId('main');
    }
  }, [isAuthenticated, authUser]);

  const updateUserData = useCallback((newUserData) => {
    const updated = { ...userData, ...newUserData };
    setUserData(updated);
    localStorage.setItem('netlife_profile', JSON.stringify(updated));
  }, [userData]);

  const switchProfile = (profileId) => {
    setActiveProfileId(profileId);
    localStorage.setItem('netlife_active_profile_id', profileId);
  };

  const getActiveProfile = useMemo(() => {
    if (!userData) return null;
    if (activeProfileId === 'main') {
      return { ...userData, id: 'main', isMain: true };
    }
    const dependent = userData.dependents?.find(d => d.id === activeProfileId);
    return dependent ? { ...dependent, isMain: false } : { ...userData, id: 'main', isMain: true }; // Fallback to main
  }, [userData, activeProfileId]);
  
  const getAllProfiles = useMemo(() => {
    if (!userData) return [];
    return [
      { ...userData, id: 'main', isMain: true },
      ...(userData.dependents || []),
    ];
  }, [userData]);


  const value = {
    userData,
    updateUserData,
    activeProfileId,
    switchProfile,
    activeProfile: getActiveProfile,
    allProfiles: getAllProfiles
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};
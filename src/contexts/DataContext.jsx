import React, { createContext, useState, useEffect } from "react";
import { profileService } from "@/services/profileService";

export const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [districts, setDistricts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      const result = await profileService.getDistricts();
      if (isMounted) {
        if (result.success) {
          setDistricts(result.data);
        }
        setIsLoading(false);
      }
    };
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  const getSubCountiesForDistrict = async (districtName) => {
    const district = districts.find((d) => d.name === districtName);
    if (!district) return [];
    const result = await profileService.getSubCounties(district.id);
    return result.success ? result.data : [];
  };

  const value = {
    districts,
    isLoadingData: isLoading,
    getSubCountiesForDistrict,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const CACHED_USER_DATA_KEY = "netlife_cached_user_data";

export const getCachedUserData = () => {
  try {
    const cachedData = localStorage.getItem(CACHED_USER_DATA_KEY);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.error("Failed to parse cached user data", error);
    return null;
  }
};

export const setCachedUserData = (profile, managedProfiles) => {
  try {
    const dataToCache = JSON.stringify({ profile, managedProfiles });
    localStorage.setItem(CACHED_USER_DATA_KEY, dataToCache);
  } catch (error) {
    console.error("Failed to cache user data", error);
  }
};

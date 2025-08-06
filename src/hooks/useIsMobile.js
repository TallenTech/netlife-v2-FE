import { useState, useEffect } from "react";

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent =
      typeof window.navigator === "undefined" ? "" : navigator.userAgent;
    const mobileRegex = /Mobi|Android|iPhone|iPad|iPod/i;
    setIsMobile(mobileRegex.test(userAgent));
  }, []);

  return isMobile;
};

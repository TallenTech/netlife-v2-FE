import { useState, useEffect, useCallback } from "react";

export const usePWAInstall = () => {
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  const isIOS = () => {
    if (typeof window === "undefined") return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  };
  const isStandalone = () => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
      setCanInstall(true);
      console.log("PWA install prompt is available.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      console.log("PWA was installed");
      setInstallPromptEvent(null);
      setCanInstall(false);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!installPromptEvent) {
      console.log("Install prompt not available.");
      return;
    }

    installPromptEvent.prompt();

    const { outcome } = await installPromptEvent.userChoice;

    console.log(`User response to the install prompt: ${outcome}`);
    setInstallPromptEvent(null);
    setCanInstall(false);

    if (outcome === "accepted") {
      setTimeout(() => {
        window.open(window.location.origin, "_self");
      }, 1000);
    }
  }, [installPromptEvent]);

  return {
    canInstall,
    handleInstallClick,
    isIOS: isIOS(),
    isStandalone: isStandalone(),
  };
};

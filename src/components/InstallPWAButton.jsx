import React from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";

const InstallPWAButton = () => {
  const { canInstall, handleInstallClick } = usePWAInstall();

  if (!canInstall) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant="default"
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
    >
      Install NetLife App
    </Button>
  );
};

export default InstallPWAButton;

import React, { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Button } from "@/components/ui/button";
import NetLifeLogo from "@/components/NetLifeLogo";

const PWAInstallPrompt = () => {
  const { canInstall, handleInstallClick } = usePWAInstall();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (canInstall && isMobile) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [canInstall, isMobile]);

  const onInstallClick = async () => {
    await handleInstallClick();
    setIsOpen(false);
  };

  const onDismiss = () => {
    setIsOpen(false);
  };

  if (!canInstall || !isMobile) {
    return null;
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex flex-col rounded-t-2xl bg-gray-50 dark:bg-gray-900">
          <div className="mx-auto my-3 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700" />
          <div className="flex flex-1 flex-col p-6 pt-4 text-center">
            <NetLifeLogo className="mx-auto mb-4 h-14 w-14" />
            <Drawer.Title className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Install the NetLife App
            </Drawer.Title>
            <Drawer.Description className="mb-6 text-gray-600 dark:text-gray-400">
              Get a faster, more reliable experience by installing the NetLife
              app on your device. It's quick, easy, and free!
            </Drawer.Description>
            <Button
              onClick={onInstallClick}
              className="w-full bg-primary py-3 text-lg font-medium text-primary-foreground"
            >
              Install NetLife App
            </Button>
            <Button
              onClick={onDismiss}
              variant="ghost"
              className="mt-3 w-full py-3 text-lg font-medium text-gray-500 dark:text-gray-400"
            >
              Not Now
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default PWAInstallPrompt;

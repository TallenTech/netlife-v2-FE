import React, { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Button } from "@/components/ui/button";
import NetLifeLogo from "@/components/NetLifeLogo";
import { Share, PlusSquare } from "lucide-react";

const PWAInstallPrompt = () => {
  const { canInstall, handleInstallClick, isIOS } = usePWAInstall();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const hasBeenDismissed =
    sessionStorage.getItem("pwa_prompt_dismissed") === "true";

  useEffect(() => {
    if ((canInstall || isIOS) && isMobile && !hasBeenDismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [canInstall, isMobile, isIOS, hasBeenDismissed]);

  const onInstallClick = async () => {
    await handleInstallClick();
    setIsOpen(false);
  };

  const onDismiss = () => {
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
    setIsOpen(false);
  };

  if (!isOpen) {
    return null;
  }

  if (isIOS) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={setIsOpen} shouldScaleBackground>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex flex-col rounded-t-2xl bg-gray-50 dark:bg-gray-900">
            <div className="mx-auto my-3 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700" />
            <div className="flex flex-1 flex-col p-6 pt-4 text-center">
              <NetLifeLogo className="mx-auto mb-4 h-14 w-14" />
              <Drawer.Title className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-50">
                Install the NetLife App on iOS
              </Drawer.Title>
              <Drawer.Description className="mb-6 text-gray-600 dark:text-gray-400">
                To install the app, tap the{" "}
                <Share className="inline-block h-4 w-4 mx-1" /> Share button in
                your Safari toolbar, then find and tap on{" "}
                <PlusSquare className="inline-block h-4 w-4 mx-1" /> "Add to
                Home Screen".
              </Drawer.Description>
              <Button
                onClick={onDismiss}
                className="w-full bg-primary py-3 text-lg font-medium text-primary-foreground"
              >
                Got It
              </Button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  if (canInstall) {
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
  }

  return null;
};

export default PWAInstallPrompt;

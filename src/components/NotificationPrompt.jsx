import React from "react";
import { Drawer } from "vaul";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { Bell, Loader2 } from "lucide-react";

export default function NotificationPrompt({ isOpen, onClose }) {
  const { subscribe, isSubscribing, error } = usePushNotifications();

  const handleEnable = async () => {
    await subscribe();
    onClose();
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex flex-col rounded-t-2xl bg-gray-50 dark:bg-gray-900">
          <div className="mx-auto my-3 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700" />
          <div className="flex flex-1 flex-col p-6 pt-4 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <Drawer.Title className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Stay Updated!
            </Drawer.Title>
            <Drawer.Description className="mb-6 text-gray-600 dark:text-gray-400">
              Enable push notifications to get important alerts about your
              account and services right on your device.
            </Drawer.Description>
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <Button
              onClick={handleEnable}
              disabled={isSubscribing}
              className="w-full bg-primary py-3 text-lg font-medium text-primary-foreground"
            >
              {isSubscribing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Bell className="mr-2 h-5 w-5" />
              )}
              Enable Notifications
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              className="mt-3 w-full py-3 text-lg font-medium text-gray-500 dark:text-gray-400"
            >
              Maybe Later
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

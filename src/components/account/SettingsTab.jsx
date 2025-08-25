import React from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Shield,
  Bell,
  Download,
  Lock,
  Share,
  PlusSquare,
} from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useUserSettings } from "@/hooks/useSettingsQueries";
import { AccountActions } from "@/components/account/AccountActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const SettingsTab = ({
  activeProfile,
  isMainProfile,
  logout,
  handleSettingsSave,
  isSavingSettings,
}) => {
  const { canInstall, handleInstallClick, isIOS, isStandalone } =
    usePWAInstall();
  const { data: settings } = useUserSettings(activeProfile?.id, isMainProfile);

  const {
    isSubscribed,
    subscribe,
    unsubscribe,
    isSubscribing,
    permission,
    error: pushError,
  } = usePushNotifications();

  const handlePushToggleChange = () => {
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  const renderAppSection = () => {
    if (isStandalone) {
      return (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
          <h4 className="font-bold text-green-900 mb-2">App Installed</h4>
          <p className="text-sm text-green-800">
            You are currently using the NetLife app. Thank you for installing!
          </p>
        </div>
      );
    }
    if (isIOS) {
      return (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-bold text-blue-900 mb-2">
            Install on your iPhone/iPad
          </h4>
          <p className="text-sm text-blue-800">
            To get the app experience, tap the{" "}
            <Share className="inline-block h-4 w-4 mx-1" /> Share button in
            Safari, then tap on{" "}
            <PlusSquare className="inline-block h-4 w-4 mx-1" /> "Add to Home
            Screen".
          </p>
        </div>
      );
    }
    if (canInstall) {
      return (
        <Button
          onClick={handleInstallClick}
          className="w-full justify-start space-x-2"
        >
          <Download size={16} />
          <span>Install NetLife App</span>
        </Button>
      );
    }
    return (
      <div className="p-3 border rounded-lg text-center text-sm text-gray-600 bg-gray-50">
        Your browser does not support direct app installation.
      </div>
    );
  };

  if (!isMainProfile) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 md:p-10 border rounded-2xl bg-gray-50 min-h-[40vh]">
        <Lock className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-bold text-gray-800">Settings Locked</h3>
        <p className="text-gray-600 max-w-sm mt-2">
          Account settings can only be viewed and managed by the main profile
          holder.
        </p>
        <p className="text-gray-600 max-w-sm mt-1">
          Please switch to the main account to make changes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 md:p-6 rounded-2xl border">
        <h3 className="font-bold text-lg mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-primary" />
          Privacy
        </h3>
        <div>
          <label className="text-sm font-medium text-gray-700">
            Auto-delete survey responses
          </label>
          <Select
            value={settings?.autoDelete || "never"}
            onValueChange={(val) =>
              handleSettingsSave({ ...settings, autoDelete: val })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">After 7 days</SelectItem>
              <SelectItem value="30">After 30 days</SelectItem>
              <SelectItem value="90">After 90 days</SelectItem>
              <SelectItem value="never">Never</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="bg-white p-4 md:p-6 rounded-2xl border">
        <h3 className="font-bold text-lg mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-primary" />
          Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <h4 className="font-medium">Silent Alerts</h4>
              <p className="text-xs text-gray-500">
                Disguise in-app notifications
              </p>
            </div>
            <Switch
              checked={settings?.silentAlerts || false}
              onCheckedChange={(val) =>
                handleSettingsSave({ ...settings, silentAlerts: val })
              }
            />
          </div>

          {permission === "denied" ? (
            <div className="p-3 border border-yellow-300 bg-yellow-50 rounded-lg text-sm text-yellow-800">
              <span className="font-semibold">
                Push notifications are blocked.
              </span>{" "}
              Please enable them in your browser settings to receive alerts.
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <h4 className="font-medium">Push Notifications</h4>
                <p className="text-xs text-gray-500">
                  Get alerts on this device
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {isSubscribing && <Loader2 className="h-4 w-4 animate-spin" />}
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={handlePushToggleChange}
                  disabled={isSubscribing}
                />
              </div>
            </div>
          )}
          {pushError && (
            <p className="text-xs text-red-600 pl-1">{pushError}</p>
          )}
        </div>
      </div>
      <div className="bg-white p-4 md:p-6 rounded-2xl border">
        <h3 className="font-bold text-lg mb-4 flex items-center">
          <Download className="w-5 h-5 mr-2 text-primary" />
          App Installation
        </h3>
        {renderAppSection()}
      </div>
      <AccountActions activeProfileId={activeProfile.id} logout={logout} />
      <Button
        onClick={() => handleSettingsSave(settings)}
        className="w-full bg-primary text-white"
        disabled={isSavingSettings}
      >
        {isSavingSettings ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
};

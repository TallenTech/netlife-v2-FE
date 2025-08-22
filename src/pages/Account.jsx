import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSaveSettings } from "@/hooks/useSettingsQueries";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { User, Settings, Users } from "lucide-react";
import { ProfileTab } from "@/components/account/ProfileTab";
import { SettingsTab } from "@/components/account/SettingsTab";

const Account = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    activeProfile,
    user,
    logout,
    updateProfile,
    refreshAuthAndProfiles,
    isLoading: isAuthLoading,
  } = useAuth();

  useScrollToTop();

  const [activeTab, setActiveTab] = useState("profile");

  const isMainProfile = activeProfile?.id === user?.id;

  const { mutate: saveSettings, isLoading: isSavingSettings } =
    useSaveSettings();

  const handleSettingsSave = (newSettings) => {
    saveSettings(
      { userId: activeProfile.id, settings: newSettings },
      {
        onSuccess: () =>
          toast({
            title: "Settings Updated",
            description: "Your preferences have been saved.",
          }),
        onError: (error) =>
          toast({
            title: "Settings Save Failed",
            description: error.message,
            variant: "destructive",
          }),
      }
    );
  };

  const handleTabChange = (value) => {
    if (value === "settings" && !isMainProfile) {
      toast({
        title: "Access Restricted",
        description: "Account settings can only be managed by the main user.",
        variant: "default",
      });
      return;
    }
    setActiveTab(value);
  };

  const firstName = activeProfile?.username?.split(" ")[0] || "";

  if (isAuthLoading || !activeProfile) {
    return (
      <div className="py-4 md:py-6 bg-white min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-6 w-32"></div>
          <div className="bg-white p-6 rounded-2xl border">
            <div className="flex flex-col items-center space-y-4 mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
              <div className="h-6 bg-gray-200 rounded w-40"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Account - {firstName}</title>
      </Helmet>
      <div className="py-4 md:py-6 bg-white min-h-screen">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
            <p className="text-gray-500">
              Editing profile for{" "}
              <span className="font-semibold">{activeProfile?.username}</span>
            </p>
          </div>
          <button
            onClick={() => navigate("/account/manage-profiles")}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200 md:hidden"
            title="Switch Profile"
          >
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Switch</span>
          </button>
        </header>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className={!isMainProfile ? "opacity-70 cursor-pointer" : ""}
            >
              <Settings className="w-4 h-4 mr-2" />
              Account Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <ProfileTab
              activeProfile={activeProfile}
              isMainProfile={isMainProfile}
              user={user}
              updateProfile={updateProfile}
              refreshAuthAndProfiles={refreshAuthAndProfiles}
              logout={logout}
            />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <SettingsTab
              activeProfile={activeProfile}
              isMainProfile={isMainProfile}
              logout={logout}
              handleSettingsSave={handleSettingsSave}
              isSavingSettings={isSavingSettings}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Account;

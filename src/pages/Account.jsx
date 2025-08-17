import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Shield,
  LogOut,
  Heart,
  User,
  Settings,
  Bell,
  Trash2,
  Download,
  ChevronsRight,
  Users,
  FolderOpen,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MobileConfirmDialog from "@/components/ui/MobileConfirmDialog";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarEmoji } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { settingsService } from "@/services/settingsService";
import { DateOfBirthPicker } from "@/components/ui/DateOfBirthPicker";
import {
  useUserSettings,
  useDistricts,
  useSaveSettings,
  useDeleteAccount,
} from "@/hooks/useSettingsQueries";

const Account = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    activeProfile,
    user,
    logout,
    updateProfile,
    isLoading: isAuthLoading,
  } = useAuth();

  const [profileData, setProfileData] = useState({});
  const [district, setDistrict] = useState("");
  const [subCounty, setSubCounty] = useState("");
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isMainProfile = activeProfile?.id === user?.id;

  const { data: districts, isLoading: loadingDistricts } = useDistricts();
  const {
    data: settings,
    isLoading: loadingSettings,
    isError,
  } = useUserSettings(activeProfile?.id);
  const { mutate: saveSettings, isLoading: isSavingSettings } =
    useSaveSettings();
  const { mutate: deleteAccount, isLoading: isDeletingAccount } =
    useDeleteAccount();

  useEffect(() => {
    if (activeProfile) {
      setProfileData({
        username: activeProfile.username || "",
        date_of_birth: activeProfile.date_of_birth || "",
        gender: activeProfile.gender || "",
        profile_picture: activeProfile.profile_picture || null,
      });
      if (isMainProfile) {
        setDistrict(activeProfile.district || "");
        setSubCounty(activeProfile.sub_county || "");
      }
    }
  }, [activeProfile, isMainProfile]);

  const handleProfileSave = async () => {
    try {
      const dataToUpdate = { ...profileData };
      if (isMainProfile) {
        dataToUpdate.district = district;
        dataToUpdate.sub_county = subCounty;
      }
      await updateProfile(dataToUpdate);
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message || "Could not save your profile.",
        variant: "destructive",
      });
    }
  };

  const handleSettingsSave = (newSettings) => {
    saveSettings(
      { userId: activeProfile.id, settings: newSettings },
      {
        onSuccess: () => {
          toast({
            title: "Settings Updated",
            description: "Your preferences have been saved.",
          });
        },
        onError: (error) => {
          toast({
            title: "Settings Save Failed",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const renderAvatar = () => {
    const picture = profileData.profile_picture;
    if (
      picture &&
      (picture.startsWith("http") || picture.startsWith("data:image"))
    ) {
      return (
        <AvatarImage src={picture} alt={profileData.username || "Profile"} />
      );
    }
    if (picture) {
      return (
        <AvatarFallback className="text-5xl bg-transparent">
          {getAvatarEmoji(picture)}
        </AvatarFallback>
      );
    }
    const firstName = profileData.username?.split(" ")[0] || "";
    return (
      <AvatarFallback>
        {firstName ? firstName.charAt(0).toUpperCase() : "A"}
      </AvatarFallback>
    );
  };

  const handleDataPurge = () => {
    const result = settingsService.purgeLocalData();
    if (result.success) {
      toast({
        title: "All Data Purged",
        description:
          "Your local data has been cleared. You will be logged out.",
        variant: "destructive",
      });
      setShowPurgeDialog(false);
      setTimeout(logout, 2000);
    } else {
      toast({
        title: "Purge Failed",
        description: "Could not purge all data.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = () => {
    deleteAccount(activeProfile.id, {
      onSuccess: () => {
        toast({
          title: "Account Deleted",
          description: "Your account has been permanently deleted.",
          variant: "destructive",
        });
        setShowDeleteDialog(false);
        setTimeout(() => {
          window.location.href = "/welcome";
        }, 2000);
      },
      onError: (error) => {
        toast({
          title: "Delete Failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleDataDownload = async () => {
    const result = await settingsService.downloadAllData(activeProfile.id);
    if (result.success) {
      toast({
        title: "Data Downloaded",
        description: "Your data has been successfully downloaded.",
      });
    } else {
      toast({
        title: "Download Failed",
        description: "Could not prepare your data for download.",
        variant: "destructive",
      });
    }
  };

  const firstName = activeProfile?.username?.split(" ")[0] || "";

  if (isAuthLoading || !activeProfile || loadingSettings) {
    return (
      <>
        <Helmet>
          <title>Account - Loading...</title>
        </Helmet>
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
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
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Account - {firstName}</title>
      </Helmet>
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
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

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Account Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-6">
            <div className="bg-white p-4 md:p-6 rounded-2xl border mb-6">
              <div className="flex flex-col items-center text-center space-y-4 mb-6">
                <Avatar className="w-24 h-24 text-5xl border-4 border-white shadow-md">
                  {renderAvatar()}
                </Avatar>
                <div>
                  <h2 className="text-lg font-bold">Personal Information</h2>
                  <p className="text-sm text-gray-500">
                    View and update your profile
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <Input
                    value={profileData.username}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        username: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={user?.email || "No email provided"}
                    disabled
                  />
                </div>
                {isMainProfile ? (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      WhatsApp Number
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={user?.phone || "No number on account"}
                        disabled
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPhoneUpdateStep(
                            phoneUpdateStep === "idle" ? "editing" : "idle"
                          )
                        }
                      >
                        {phoneUpdateStep === "idle" ? "Change" : "Cancel"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border rounded-lg text-center text-sm text-gray-600 bg-gray-50">
                    Phone number can only be changed for the main account
                    holder.
                  </div>
                )}
                {phoneUpdateStep === "editing" && (
                  <div className="p-3 border rounded-lg space-y-2">
                    <label className="text-sm font-medium">
                      Enter New Number
                    </label>
                    <Input
                      placeholder="+256712345678"
                      value={newPhoneNumber}
                      onChange={(e) => setNewPhoneNumber(e.target.value)}
                    />
                    <Button
                      onClick={handleInitiatePhoneUpdate}
                      disabled={isUpdating}
                      className="w-full"
                    >
                      {isUpdating ? "Sending..." : "Send Verification Code"}
                    </Button>
                  </div>
                )}
                {phoneUpdateStep === "verifying" && (
                  <div className="p-3 border rounded-lg space-y-2 bg-primary/5">
                    <label className="text-sm font-medium">
                      Enter 6-Digit Code
                    </label>
                    <p className="text-xs text-gray-500">
                      Sent to {newPhoneNumber}
                    </p>
                    <Input
                      placeholder="123456"
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value)}
                    />
                    <Button
                      onClick={handleVerifyPhoneUpdate}
                      disabled={isUpdating}
                      className="w-full"
                    >
                      {isUpdating ? "Verifying..." : "Verify and Update Number"}
                    </Button>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <DateOfBirthPicker
                    value={profileData.date_of_birth}
                    onChange={(date) =>
                      setProfileData((p) => ({ ...p, date_of_birth: date }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <Select
                    value={profileData.gender}
                    onValueChange={(value) =>
                      setProfileData({ ...profileData, gender: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Prefer not to say">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isMainProfile ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        District
                      </label>
                      <Select
                        value={district}
                        onValueChange={(value) => setDistrict(value)}
                        disabled={loadingDistricts}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingDistricts
                                ? "Loading..."
                                : "Select District"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {(districts || []).map((d) => (
                            <SelectItem key={d.id} value={d.name}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Sub County
                      </label>
                      <Input
                        placeholder="e.g. Kawempe"
                        value={subCounty}
                        onChange={(e) => setSubCounty(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border rounded-lg text-center text-sm text-gray-600 bg-gray-50">
                    Location is managed by the main account holder.
                  </div>
                )}
                <Button
                  onClick={handleProfileSave}
                  className="w-full bg-primary text-white pt-4"
                >
                  Save Profile Changes
                </Button>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border mb-6 space-y-2">
              <button
                onClick={() => navigate("/account/manage-profiles")}
                className="flex items-center w-full text-left space-x-4 p-3 rounded-lg hover:bg-gray-50"
              >
                <Users className="text-primary" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">
                    Manage & Switch Profiles
                  </h3>
                  <p className="text-sm text-gray-500">
                    Currently browsing as:{" "}
                    <span className="font-bold">{activeProfile?.username}</span>
                  </p>
                </div>
                <ChevronsRight className="text-gray-400" size={16} />
              </button>
              <div className="border-t"></div>
              <button
                onClick={() => navigate("/account/health-interests")}
                className="flex items-center w-full text-left space-x-4 p-3 rounded-lg hover:bg-gray-50"
              >
                <Heart className="text-primary" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">
                    Health Interests
                  </h3>
                  <p className="text-sm text-gray-500">
                    Tailor content to your preferences
                  </p>
                </div>
                <ChevronsRight className="text-gray-400" size={16} />
              </button>
              <div className="border-t"></div>
              <button
                onClick={() => navigate("/my-files")}
                className="flex items-center w-full text-left space-x-4 p-3 rounded-lg hover:bg-gray-50"
              >
                <FolderOpen className="text-primary" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">My Files</h3>
                  <p className="text-sm text-gray-500">
                    Store and manage your documents
                  </p>
                </div>
                <ChevronsRight className="text-gray-400" size={16} />
              </button>
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              className="w-full flex items-center space-x-2 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </Button>
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              <div className="bg-white p-4 md:p-6 rounded-2xl border">
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-primary" />
                  Privacy
                </h3>
                <div className="space-y-4">
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
                        Disguise notifications
                      </p>
                    </div>
                    <Switch
                      checked={settings?.silentAlerts || false}
                      onCheckedChange={(val) =>
                        handleSettingsSave({ ...settings, silentAlerts: val })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-2xl border">
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-primary" />
                  Account Actions
                </h3>
                <div className="space-y-3">
                  <Button
                    onClick={handleDataDownload}
                    variant="outline"
                    className="w-full justify-start space-x-2"
                  >
                    <Download size={16} />
                    <span>Download All Data</span>
                  </Button>
                  <Button
                    onClick={() => setShowPurgeDialog(true)}
                    variant="outline"
                    className="w-full justify-start space-x-2"
                  >
                    <Trash2 size={16} />
                    <span>Purge Local Data</span>
                  </Button>
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    variant="destructive"
                    className="w-full justify-start space-x-2"
                  >
                    <Trash2 size={16} />
                    <span>Delete Account</span>
                  </Button>
                </div>
              </div>
              <Button
                onClick={() => handleSettingsSave(settings)}
                className="w-full bg-primary text-white"
                disabled={isSavingSettings}
              >
                {isSavingSettings ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <MobileConfirmDialog
          isOpen={showPurgeDialog}
          onClose={() => setShowPurgeDialog(false)}
          onConfirm={handleDataPurge}
          title="Purge Local Data?"
          description="This will permanently delete all data stored on this device. Your account on the server will not be affected."
          confirmText="Yes, purge data"
        />
        <MobileConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteAccount}
          title="Delete Account?"
          description="This action cannot be undone. This will permanently delete your account and remove all your data from our servers."
          confirmText="Yes, delete my account"
          isLoading={isDeletingAccount}
        />
      </div>
    </>
  );
};

export default Account;

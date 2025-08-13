import React, { useState, useEffect, useCallback } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import FileUpload from "@/components/FileUpload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarEmoji } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";

const Account = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    activeProfile,
    user,
    logout,
    updateProfile,
    deleteAccount,
    refreshSession,
  } = useAuth();

  const [profileData, setProfileData] = useState({
    username: "",
    date_of_birth: "",
    gender: "",
    profile_picture: null,
  });
  const [location, setLocation] = useState("");
  const [phoneUpdateStep, setPhoneUpdateStep] = useState("idle");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [settings, setSettings] = useState({
    autoDelete: "30",
    fakeAccountMode: false,
    silentAlerts: false,
    crisisOverride: true,
  });

  useEffect(() => {
    if (activeProfile) {
      setProfileData({
        username: activeProfile.username || "",
        date_of_birth: activeProfile.date_of_birth || "",
        gender: activeProfile.gender || "",
        profile_picture: activeProfile.profile_picture || null,
      });
      const subCounty = activeProfile.sub_county || "";
      const district = activeProfile.district || "";
      setLocation(
        subCounty && district
          ? `${subCounty}, ${district}`
          : subCounty || district
      );
    }
    const savedSettings = localStorage.getItem("netlife_settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [activeProfile]);

  const handleProfileSave = async () => {
    try {
      const [sub_county, district] = location.split(",").map((s) => s.trim());
      const dataToUpdate = {
        ...profileData,
        ...(activeProfile?.id === user?.id && {
          sub_county: sub_county || "",
          district: district || "",
        }),
      };
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

  const handleSettingsSave = () => {
    localStorage.setItem("netlife_settings", JSON.stringify(settings));
    toast({
      title: "Settings Updated",
      description: "Your preferences have been saved.",
    });
  };

  const onFileSelect = useCallback((file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({ ...prev, profile_picture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

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
    localStorage.clear();
    toast({
      title: "All Data Purged",
      description: "Your local data has been cleared. You will be logged out.",
      variant: "destructive",
    });
    setTimeout(logout, 2000);
  };

  const handleDeleteAccount = async () => {
    try {
      if (deleteAccount) await deleteAccount();
      else logout();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete account.",
        variant: "destructive",
      });
    }
  };

  const handleDataDownload = () => {
    try {
      const dataToDownload = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("netlife_")) {
          dataToDownload[key] = JSON.parse(localStorage.getItem(key));
        }
      }
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(dataToDownload, null, 2));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute(
        "download",
        `netlife_data_backup_${new Date().toISOString()}.json`
      );
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast({
        title: "Data Downloaded",
        description: "Your data has been successfully downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not prepare your data for download.",
        variant: "destructive",
      });
    }
  };

  const handleInitiatePhoneUpdate = async () => {
    if (!newPhoneNumber || !/^\+[1-9]\d{1,14}$/.test(newPhoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description:
          "Please enter a valid number in international format (e.g., +2567...).",
        variant: "destructive",
      });
      return;
    }
    setIsUpdating(true);
    const { success, error } = await profileService.updatePhoneNumber(
      newPhoneNumber
    );
    setIsUpdating(false);
    if (success) {
      setPhoneUpdateStep("verifying");
      toast({
        title: "Verification Code Sent",
        description: "Check your new WhatsApp for an OTP.",
      });
    } else {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleVerifyPhoneUpdate = async () => {
    if (!phoneOtp || phoneOtp.length < 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }
    setIsUpdating(true);
    const { success, error } = await profileService.verifyPhoneUpdate(
      newPhoneNumber,
      phoneOtp
    );
    setIsUpdating(false);
    if (success) {
      await refreshSession();
      setPhoneUpdateStep("idle");
      setNewPhoneNumber("");
      setPhoneOtp("");
      toast({
        title: "Success!",
        description: "Your phone number has been updated.",
      });
    } else {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const firstName = activeProfile?.username?.split(" ")[0] || "";

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
                <FileUpload
                  onFileSelect={onFileSelect}
                  previewUrl={profileData.profile_picture}
                  isAvatar={true}
                >
                  <Avatar className="w-24 h-24 text-5xl border-4 border-white shadow-md">
                    {renderAvatar()}
                  </Avatar>
                </FileUpload>
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
                    Name or Nickname
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

                {activeProfile?.id === user?.id ? (
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
                  <Input
                    type="date"
                    value={profileData.date_of_birth}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        date_of_birth: e.target.value,
                      })
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
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Location (Sub-county, District)
                  </label>
                  <Input
                    placeholder="e.g. Kawempe, Kampala"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={activeProfile?.id !== user?.id}
                  />
                  {activeProfile?.id !== user?.id && (
                    <p className="text-xs text-gray-400 mt-1">
                      Location can only be set on the main profile.
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleProfileSave}
                  className="w-full bg-primary text-white"
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
                  <h3 className="font-semibold text-gray-800">
                    My Files
                  </h3>
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
                      value={settings.autoDelete}
                      onValueChange={(val) =>
                        setSettings({ ...settings, autoDelete: val })
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
                      checked={settings.silentAlerts}
                      onCheckedChange={(val) =>
                        setSettings({ ...settings, silentAlerts: val })
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start space-x-2"
                      >
                        <Trash2 size={16} />
                        <span>Purge Local Data</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all data stored on this
                          device. Your account on the server will not be
                          affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDataPurge}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, purge data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full justify-start space-x-2"
                      >
                        <Trash2 size={16} />
                        <span>Delete Account</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete your account and remove all your data from our
                          servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, delete my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <Button
                onClick={handleSettingsSave}
                className="w-full bg-primary text-white"
              >
                Save Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Account;

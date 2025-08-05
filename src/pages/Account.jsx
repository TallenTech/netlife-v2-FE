import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Shield, LogOut, Heart, Users, FilePlus, User, Settings, Bell, Trash2, Download, ChevronsRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useUserData } from '@/contexts/UserDataContext';
import { useNavigate } from 'react-router-dom';
import FileUpload from '@/components/FileUpload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarEmoji } from '@/lib/utils';


const Account = ({ handleLogout }) => {
  const { toast } = useToast();
  const { userData, updateUserData, activeProfile } = useUserData();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    location: '',
    language: 'english',
    contactMethod: 'WhatsApp',
    profilePhoto: null,
    avatar: 'avatar-2',
    isAnonymous: false,
  });

  const [settings, setSettings] = useState({
    autoDelete: '30',
    fakeAccountMode: false,
    silentAlerts: false,
    crisisOverride: true,
  });

  useEffect(() => {
    if (activeProfile) {
      setProfileData({
        username: activeProfile.username || '',
        email: activeProfile.email || '',
        phoneNumber: activeProfile.phoneNumber || '',
        location: `${activeProfile.subCounty || ''}${activeProfile.subCounty ? ', ' : ''}${activeProfile.district || ''}`,
        language: localStorage.getItem('netlife_language') || 'english',
        contactMethod: activeProfile.contactMethod || 'WhatsApp',
        profilePhoto: activeProfile.profilePhoto || null,
        avatar: activeProfile.avatar || 'avatar-2',
        isAnonymous: activeProfile.isAnonymous || false,
      });
    }
    const savedSettings = localStorage.getItem('netlife_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [activeProfile]);

  const handleProfileSave = () => {
    // This function should only edit the main user profile, not dependents.
    if (!activeProfile.isMain) {
        toast({ title: "Read-only", description: "Dependent profiles are managed in 'Manage Profiles'", variant: "destructive"});
        return;
    }

    const [subCounty, district] = profileData.location.split(', ');
    const updatedProfile = {
      ...userData,
      username: profileData.username,
      email: profileData.email,
      contactMethod: profileData.contactMethod,
      isAnonymous: profileData.isAnonymous,
      profilePhoto: profileData.profilePhoto,
      avatar: profileData.avatar,
      subCounty: subCounty || '',
      district: district || userData.district,
    };
    updateUserData(updatedProfile);
    localStorage.setItem('netlife_language', profileData.language);
    toast({
      title: 'Profile Updated',
      description: 'Your changes have been saved successfully.',
    });
  };

  const handleSettingsSave = () => {
    localStorage.setItem('netlife_settings', JSON.stringify(settings));
    toast({
      title: 'Settings Updated',
      description: 'Your preferences have been saved.',
    });
  };

  const onFileSelect = useCallback((file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, profilePhoto: reader.result, avatar: null }));
      };
      reader.readAsDataURL(file);
    }
  }, []);
  
  const renderAvatar = () => {
    if (profileData.profilePhoto) {
        return <AvatarImage src={profileData.profilePhoto} alt="Profile" />
    }
    if (profileData.avatar) {
        return <AvatarFallback className="text-5xl bg-transparent">{getAvatarEmoji(profileData.avatar)}</AvatarFallback>
    }
    const firstName = profileData.username?.split(' ')[0] || '';
    return <AvatarFallback>{firstName.charAt(0).toUpperCase()}</AvatarFallback>
  }


  const handleDataPurge = () => {
    localStorage.clear();
    toast({
        title: "All Data Purged",
        description: "Your local data has been cleared. You will be logged out.",
        variant: "destructive",
    });
    setTimeout(handleLogout, 2000);
  };

  const handleDataDownload = () => {
      try {
          const dataToDownload = {};
          for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key.startsWith('netlife_')) {
                  dataToDownload[key] = JSON.parse(localStorage.getItem(key));
              }
          }
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToDownload, null, 2));
          const downloadAnchorNode = document.createElement('a');
          downloadAnchorNode.setAttribute("href", dataStr);
          downloadAnchorNode.setAttribute("download", `netlife_data_backup_${new Date().toISOString()}.json`);
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
          toast({
              title: "Data Downloaded",
              description: "Your data has been successfully downloaded as a JSON file.",
          });
      } catch (error) {
          toast({
              title: "Download Failed",
              description: "Could not prepare your data for download.",
              variant: "destructive",
          });
      }
  };

  const firstName = activeProfile?.username?.split(' ')[0] || '';

  return (
    <>
      <Helmet>
        <title>Account - NetLife</title>
      </Helmet>
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-500">Manage your profile, privacy, and settings, {firstName}</p>
        </header>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" />Profile</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Account Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-6">
            <div className="bg-white p-4 md:p-6 rounded-2xl border mb-6">
              <div className="flex flex-col items-center text-center space-y-4 mb-6">
                <FileUpload onFileSelect={onFileSelect} previewUrl={profileData.profilePhoto} isAvatar={true} >
                    <Avatar className="w-24 h-24 text-5xl border-4 border-white shadow-md">
                        {renderAvatar()}
                    </Avatar>
                </FileUpload>
                <div>
                  <h2 className="text-lg font-bold">Personal Information</h2>
                  <p className="text-sm text-gray-500">View and update your profile</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name or Nickname</label>
                  <Input value={profileData.username} onChange={e => setProfileData({...profileData, username: e.target.value})} disabled={!activeProfile.isMain} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email Address (Optional)</label>
                  <Input type="email" placeholder="you@example.com" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} disabled={!activeProfile.isMain} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">WhatsApp Number</label>
                  <Input value={profileData.phoneNumber} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <Input value={profileData.location} onChange={e => setProfileData({...profileData, location: e.target.value})} disabled={!activeProfile.isMain} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Preferred Language</label>
                  <Select value={profileData.language} onValueChange={value => setProfileData({...profileData, language: value})} disabled={!activeProfile.isMain}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="luganda">Luganda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Preferred Contact Method</label>
                  <Select value={profileData.contactMethod} onValueChange={value => setProfileData({...profileData, contactMethod: value})} disabled={!activeProfile.isMain}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Call">Phone Call</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <h4 className="font-medium">Anonymize Profile</h4>
                    <p className="text-xs text-gray-500">Hide your identity in the app</p>
                  </div>
                  <Switch checked={profileData.isAnonymous} onCheckedChange={val => setProfileData({...profileData, isAnonymous: val})} disabled={!activeProfile.isMain} />
                </div>
                {activeProfile.isMain && <Button onClick={handleProfileSave} className="w-full bg-primary text-white">Save Profile Changes</Button>}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border mb-6 space-y-2">
              <button onClick={() => navigate('/account/health-interests')} className="flex items-center w-full text-left space-x-4 p-3 rounded-lg hover:bg-gray-50">
                <Heart className="text-primary" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">Health Interests</h3>
                  <p className="text-sm text-gray-500">Tailor content to your preferences</p>
                </div>
                <ChevronsRight className="text-gray-400" size={16}/>
              </button>
              <div className="border-t"></div>
              <button onClick={() => navigate('/account/manage-profiles')} className="flex items-center w-full text-left space-x-4 p-3 rounded-lg hover:bg-gray-50">
                <Users className="text-primary" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">Manage Multiple Profiles</h3>
                  <p className="text-sm text-gray-500">Add and manage family or friends</p>
                </div>
                <ChevronsRight className="text-gray-400" size={16}/>
              </button>
              <div className="border-t"></div>
              <button onClick={() => navigate('/account/health-records')} className="flex items-center w-full text-left space-x-4 p-3 rounded-lg hover:bg-gray-50">
                <FilePlus className="text-primary" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">Upload Health Records</h3>
                  <p className="text-sm text-gray-500">Securely store your documents</p>
                </div>
                <ChevronsRight className="text-gray-400" size={16}/>
              </button>
            </div>
             <Button onClick={handleLogout} variant="ghost" className="w-full flex items-center space-x-2 text-red-500 hover:text-red-600 hover:bg-red-50">
                <LogOut size={16} />
                <span>Logout</span>
              </Button>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              <div className="bg-white p-4 md:p-6 rounded-2xl border">
                <h3 className="font-bold text-lg mb-4 flex items-center"><Shield className="w-5 h-5 mr-2 text-primary"/>Privacy</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Auto-delete survey responses</label>
                    <Select value={settings.autoDelete} onValueChange={val => setSettings({...settings, autoDelete: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">After 7 days</SelectItem>
                        <SelectItem value="30">After 30 days</SelectItem>
                        <SelectItem value="90">After 90 days</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <h4 className="font-medium">"Fake Account" Mode</h4>
                      <p className="text-xs text-gray-500">Shows a generic dashboard if enabled</p>
                    </div>
                    <Switch checked={settings.fakeAccountMode} onCheckedChange={val => setSettings({...settings, fakeAccountMode: val})} />
                  </div>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full">Purge All My Data Now</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure you want to purge your data?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete all your locally stored data, including profile, survey results, and history. This action cannot be undone.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDataPurge} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Yes, purge my data
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-2xl border">
                <h3 className="font-bold text-lg mb-4 flex items-center"><Bell className="w-5 h-5 mr-2 text-primary"/>Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <h4 className="font-medium">Silent Alerts</h4>
                      <p className="text-xs text-gray-500">Disguise notifications (e.g., "Weather update")</p>
                    </div>
                    <Switch checked={settings.silentAlerts} onCheckedChange={val => setSettings({...settings, silentAlerts: val})} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <h4 className="font-medium">Crisis-only Override</h4>
                      <p className="text-xs text-gray-500">Urgent alerts bypass silent mode</p>
                    </div>
                    <Switch checked={settings.crisisOverride} onCheckedChange={val => setSettings({...settings, crisisOverride: val})} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 md:p-6 rounded-2xl border">
                 <h3 className="font-bold text-lg mb-4 flex items-center"><Settings className="w-5 h-5 mr-2 text-primary"/>Account Actions</h3>
                 <div className="space-y-3">
                    <Button onClick={handleDataDownload} variant="outline" className="w-full justify-start space-x-2"><Download size={16}/><span>Download All Data</span></Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full justify-start space-x-2"><Trash2 size={16}/><span>Delete Account</span></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Yes, delete my account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                 </div>
              </div>
              <Button onClick={handleSettingsSave} className="w-full bg-primary text-white">Save Settings</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Account;
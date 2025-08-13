import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Shield, LogOut, Heart, Users, FilePlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const Profile = ({ userData, handleLogout }) => {
  const [profileData, setProfileData] = useState({
    username: userData?.username || '',
    phoneNumber: userData?.phoneNumber || '',
    language: localStorage.getItem('netlife_language') || 'english',
    contactMethod: userData?.contactMethod || 'WhatsApp',
    profilePhoto: userData?.profilePhoto || null,
    avatar: userData?.avatar || 'avatar-2',
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleSaveChanges = () => {
    const updatedProfile = { ...userData, ...profileData };
    localStorage.setItem('netlife_profile', JSON.stringify(updatedProfile));
    localStorage.setItem('netlife_language', profileData.language);
    toast({
      title: 'Profile Updated',
      description: 'Your changes have been saved successfully.',
    });
    window.location.reload();
  };

  const handleFeatureClick = (featureName) => {
    toast({
      title: `🚧 ${featureName} Not Implemented`,
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, profilePhoto: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const getAvatarEmoji = (avatarId) => {
    const emojiMap = {
      'avatar-1': '👨🏻', 'avatar-2': '👩🏻', 'avatar-3': '👨🏽', 'avatar-4': '👩🏽',
      'avatar-5': '👨🏿', 'avatar-6': '👩🏿', 'avatar-7': '👦🏻', 'avatar-8': '👧🏽',
      'avatar-9': '👨🏿‍🦱', 'avatar-10': '👩🏿‍🦱', 'avatar-11': '👨🏽‍🦲', 'avatar-12': '👩🏿‍🦲'
    };
    return emojiMap[avatarId] || '👤';
  };

  return (
    <>
      <Helmet>
        <title>Profile & Settings - NetLife</title>
      </Helmet>
      <div className="p-6 bg-gray-50 min-h-screen">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500">Manage your account and privacy</p>
        </header>

        <div className="bg-white p-6 rounded-2xl border mb-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <button onClick={handleAvatarClick} className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-5xl overflow-hidden">
                {profileData.profilePhoto ? <img src={profileData.profilePhoto} alt="Profile" className="w-full h-full object-cover" /> : getAvatarEmoji(profileData.avatar)}
              </button>
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white">
                <Camera size={14} />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold">Personal Information</h2>
              <p className="text-sm text-gray-500">Update your profile details</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Username</label>
              <Input value={profileData.username} onChange={e => setProfileData({ ...profileData, username: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Preferred Contact Method</label>
              <Select value={profileData.contactMethod} onValueChange={value => setProfileData({ ...profileData, contactMethod: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Call">Phone Call</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveChanges} className="w-full bg-primary text-white">Save Changes</Button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border mb-6 space-y-2">
          <button onClick={() => handleFeatureClick('Health Interests')} className="flex items-center w-full text-left space-x-4 p-2 rounded-lg hover:bg-gray-50">
            <Heart className="text-primary" size={24} />
            <div>
              <h3 className="font-bold text-gray-800">Health Interests</h3>
              <p className="text-sm text-gray-500">Tailor content to your preferences</p>
            </div>
          </button>
          <div className="border-t"></div>
          <button onClick={() => handleFeatureClick('Manage Dependents')} className="flex items-center w-full text-left space-x-4 p-2 rounded-lg hover:bg-gray-50">
            <Users className="text-primary" size={24} />
            <div>
              <h3 className="font-bold text-gray-800">Manage Dependents</h3>
              <p className="text-sm text-gray-500">Add and manage family profiles</p>
            </div>
          </button>
          <div className="border-t"></div>
          <button onClick={() => handleFeatureClick('Upload Health Records')} className="flex items-center w-full text-left space-x-4 p-2 rounded-lg hover:bg-gray-50">
            <FilePlus className="text-primary" size={24} />
            <div>
              <h3 className="font-bold text-gray-800">Upload Health Records</h3>
              <p className="text-sm text-gray-500">Securely store your documents</p>
            </div>
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border mb-6">
          <button onClick={() => navigate('/privacy')} className="flex items-center w-full text-left space-x-4 p-2 rounded-lg hover:bg-gray-50">
            <Shield className="text-primary" size={24} />
            <div>
              <h3 className="font-bold text-gray-800">Privacy & Security</h3>
              <p className="text-sm text-gray-500">Manage data and security settings</p>
            </div>
          </button>
        </div>

        <Button onClick={handleLogout} variant="destructive" className="w-full flex items-center space-x-2">
          <LogOut size={16} />
          <span>Safe Exit</span>
        </Button>
      </div>
    </>
  );
};

export default Profile;
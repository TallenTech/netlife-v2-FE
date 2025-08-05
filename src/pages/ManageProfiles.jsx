import React from 'react';
import { Helmet } from 'react-helmet';
import { useUserData } from '@/contexts/UserDataContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Trash2, Edit, CheckCircle, Repeat } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

const ManageProfiles = () => {
    const { userData, updateUserData, switchProfile, activeProfile, allProfiles } = useUserData();
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleDeleteProfile = (idToDelete) => {
        if (idToDelete === 'main') return;
        const updatedDependents = userData.dependents.filter((p) => p.id !== idToDelete);
        updateUserData({ ...userData, dependents: updatedDependents });
        
        if(activeProfile.id === idToDelete) {
            switchProfile('main');
        }

        toast({
            title: 'Profile Deleted',
            description: 'The profile has been removed.',
        });
    };
    
    const handleSwitchProfile = (profileId) => {
        switchProfile(profileId);
        const profileName = allProfiles.find(p => p.id === profileId)?.username;
        toast({
            title: 'Profile Switched',
            description: `You are now acting as ${profileName}.`,
        });
    };
    
    const getAvatarEmoji = (avatarId) => {
        const emojiMap = {
          'avatar-1': '👨🏻', 'avatar-2': '👩🏻', 'avatar-3': '👨🏽', 'avatar-4': '👩🏽',
          'avatar-5': '👨🏿', 'avatar-6': '👩🏿', 'avatar-7': '👦🏻', 'avatar-8': '👧🏽',
          'avatar-9': '👨🏿‍🦱', 'avatar-10': '👩🏿‍🦱', 'avatar-11': '👨🏽‍🦲', 'avatar-12': '👩🏿‍🦲'
        };
        return emojiMap[avatarId] || '👤';
    };

    const renderAvatar = (profile) => {
        if (profile?.profilePhoto) {
            return <AvatarImage src={profile.profilePhoto} alt={profile.username} />
        }
        if (profile?.avatar) {
            return <AvatarFallback className="text-xl bg-transparent">{getAvatarEmoji(profile.avatar)}</AvatarFallback>
        }
        return <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
    }

    return (
        <>
            <Helmet>
                <title>Manage Profiles - NetLife</title>
            </Helmet>
            <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
                <header className="flex items-center space-x-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Manage Profiles</h1>
                        <p className="text-sm text-gray-500">Add, edit, or switch between profiles.</p>
                    </div>
                </header>

                <div className="bg-white p-6 rounded-2xl border space-y-4">
                    {allProfiles.map((profile) => (
                        <div key={profile.id} className={`flex items-center justify-between p-3 rounded-lg ${activeProfile.id === profile.id ? 'bg-primary/10 border border-primary' : 'bg-gray-50'}`}>
                            <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10">
                                    {renderAvatar(profile)}
                                </Avatar>
                                <span className="font-semibold">{profile.username} {profile.isMain && '(You)'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                {activeProfile.id === profile.id ? (
                                    <Button size="sm" variant="ghost" className="text-green-600 cursor-default">
                                        <CheckCircle size={14} className="mr-1"/> Active
                                    </Button>
                                ) : (
                                    <Button size="sm" variant="outline" onClick={() => handleSwitchProfile(profile.id)}>
                                        <Repeat size={14} className="mr-1"/> Switch
                                    </Button>
                                )}
                                {!profile.isMain && (
                                    <>
                                        <Button size="icon" variant="ghost" onClick={() => navigate(`/account/add-profile?edit=${profile.id}`)}>
                                            <Edit size={16} />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600">
                                                    <Trash2 size={16} />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the profile for {profile.username}. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteProfile(profile.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {allProfiles.length === 1 && (
                        <p className="text-center text-gray-500 py-8">No additional profiles. Add one to get started.</p>
                    )}
                </div>

                <Button className="w-full mt-6" onClick={() => navigate('/account/add-profile')}>
                    <UserPlus className="mr-2 h-4 w-4" /> Add New Profile
                </Button>
            </div>
        </>
    );
};

export default ManageProfiles;
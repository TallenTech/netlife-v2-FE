import React from 'react';
import { ChevronsUpDown, PlusCircle, User, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserData } from '@/contexts/UserDataContext';
import { useNavigate } from 'react-router-dom';
import { getAvatarEmoji } from '@/lib/utils';

const ProfileSwitcher = () => {
  const { allProfiles, activeProfile, switchProfile } = useUserData();
  const navigate = useNavigate();

  const renderAvatar = (profile) => {
    if (profile?.profilePhoto) {
      return <AvatarImage src={profile.profilePhoto} alt={profile.username} />;
    }
    if (profile?.avatar) {
      return <AvatarFallback className="bg-transparent text-xl">{getAvatarEmoji(profile.avatar)}</AvatarFallback>;
    }
    return <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>;
  };

  const firstName = activeProfile?.username?.split(' ')[0] || 'User';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex justify-between items-center text-left p-3 h-auto hover:bg-gray-100"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {renderAvatar(activeProfile)}
            </Avatar>
            <div className="flex flex-col">
              <span className="font-bold text-gray-800 text-sm">{firstName}</span>
              <span className="text-xs text-gray-500">My Account</span>
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel>Switch Profile</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allProfiles.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            onSelect={() => switchProfile(profile.id)}
            className="flex justify-between items-center"
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {renderAvatar(profile)}
              </Avatar>
              <span>{profile.username}</span>
            </div>
            {activeProfile?.id === profile.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/account/add-profile')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Add Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/account/manage-profiles')}>
          <User className="mr-2 h-4 w-4" />
          <span>Manage Profiles</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileSwitcher;
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, HeartHandshake, Video, History, User, LogOut } from 'lucide-react';
import NetLifeLogo from '@/components/NetLifeLogo';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/services', icon: HeartHandshake, label: 'Services' },
  { path: '/videos', icon: Video, label: 'Videos' },
  { path: '/history', icon: History, label: 'History' },
];

const getAvatarEmoji = (avatarId) => {
  const emojiMap = {
    'avatar-1': '👨🏻', 'avatar-2': '👩🏻', 'avatar-3': '👨🏽', 'avatar-4': '👩🏽',
    'avatar-5': '👨🏿', 'avatar-6': '👩🏿', 'avatar-7': '👦🏻', 'avatar-8': '👧🏽',
    'avatar-9': '👨🏿‍🦱', 'avatar-10': '👩🏿‍🦱', 'avatar-11': '👨🏽‍🦲', 'avatar-12': '👩🏿‍🦲'
  };
  return emojiMap[avatarId] || '👤';
};

const SideNav = ({ userData, handleLogout }) => {
  return (
    <aside className="hidden md:flex flex-col w-64 h-screen p-4 bg-white border-r fixed">
      <div className="flex items-center space-x-2 mb-10">
        <NetLifeLogo className="w-20 h-10" />
        {/* <span className="text-xl font-bold text-primary font-lora">NetLife</span> */}
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="w-6 h-6" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <NavLink
          to="/account"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors duration-200 ${
              isActive
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-lg overflow-hidden">
            {userData?.profilePhoto ? (
              <img src={userData.profilePhoto} alt="Account" className="w-full h-full object-cover" />
            ) : (
              getAvatarEmoji(userData?.avatar)
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{userData?.username || 'User'}</p>
            <p className="text-xs text-gray-500">My Account</p>
          </div>
        </NavLink>
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600 space-x-3 px-4 py-3">
          <LogOut className="w-6 h-6" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
};

export default SideNav;
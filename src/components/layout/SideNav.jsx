import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  HeartPulse,
  PlayCircle,
  History,
  FolderOpen,
  LogOut,
  Users,
  ChevronsRight,
  Share2,
} from "lucide-react";
import NetLifeLogo from "@/components/NetLifeLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarEmoji } from "@/lib/utils";
import { cn } from "@/lib/utils";
import InvitationModal from "@/components/invitation/InvitationModal";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/services", icon: HeartPulse, label: "Services" },
  { path: "/videos", icon: PlayCircle, label: "Videos" },
  { path: "/history", icon: History, label: "History" },
  { path: "/my-files", icon: FolderOpen, label: "My Files" },
];

const SideNav = () => {
  const { activeProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);

  // Reset image error when profile picture changes
  React.useEffect(() => {
    if (activeProfile?.profile_picture) {
      setImageError(false);
    }
  }, [activeProfile?.profile_picture]);

  const renderAvatar = () => {
    if (!activeProfile) {
      return <AvatarFallback>A</AvatarFallback>;
    }

    const picture = activeProfile.profile_picture;

    // Check if it's a URL (uploaded photo)
    if (picture && (picture.startsWith("http") || picture.startsWith("data:")) && !imageError) {
      return (
        <AvatarImage
          src={picture}
          alt={activeProfile.username}
          className="object-cover"
          onLoad={() => setImageError(false)}
          onError={() => setImageError(true)}
        />
      );
    }

    // Check if it's an avatar ID
    if (picture && picture.startsWith("avatar-")) {
      return (
        <AvatarFallback className="bg-transparent text-lg">
          {getAvatarEmoji(picture)}
        </AvatarFallback>
      );
    }

    // Fallback to first letter of username
    return (
      <AvatarFallback>
        {activeProfile.username?.charAt(0).toUpperCase() || "A"}
      </AvatarFallback>
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen p-4 bg-white border-r fixed">
      <div className="flex items-center space-x-2 mb-10">
        <NetLifeLogo className="w-20 h-10" />
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 text-gray-600 hover:bg-gray-100",
                isActive && "bg-primary/10 text-primary font-bold"
              )
            }
          >
            <item.icon className="w-6 h-6" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-2">
        <NavLink
          to="/account"
          className={({ isActive }) =>
            cn(
              "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 text-gray-600 hover:bg-gray-100",
              isActive && "bg-primary/10 text-primary font-bold"
            )
          }
        >
          <Avatar className="w-8 h-8">{renderAvatar()}</Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="font-semibold truncate">
              {activeProfile?.username || "User"}
            </p>
            <p className="text-xs text-gray-500">My Account</p>
          </div>
        </NavLink>

        <button
          onClick={() => navigate("/account/manage-profiles")}
          className="flex items-center w-full text-left space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 text-gray-600 hover:bg-gray-100"
        >
          <Users className="w-6 h-6 text-primary" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Switch Profile</p>
          </div>
          <ChevronsRight className="w-4 h-4 text-gray-400" />
        </button>

        <button
          onClick={() => setShowInvitationModal(true)}
          className="flex items-center w-full text-left space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 text-green-600 hover:bg-green-50"
        >
          <Share2 className="w-6 h-6 text-green-600" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Invite Friends</p>
          </div>
        </button>
      </div>

      <InvitationModal
        isOpen={showInvitationModal}
        onClose={() => setShowInvitationModal(false)}
        userId={activeProfile?.id}
      />
    </aside>
  );
};

export default SideNav;

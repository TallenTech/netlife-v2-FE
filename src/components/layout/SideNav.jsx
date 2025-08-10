import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  HeartPulse,
  PlayCircle,
  History,
  LogOut,
  Users,
  ChevronsRight,
} from "lucide-react";
import NetLifeLogo from "@/components/NetLifeLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarEmoji } from "@/lib/utils";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/services", icon: HeartPulse, label: "Services" },
  { path: "/videos", icon: PlayCircle, label: "Videos" },
  { path: "/history", icon: History, label: "History" },
];

const SideNav = () => {
  const { activeProfile, logout } = useAuth();
  const navigate = useNavigate();

  const renderAvatar = () => {
    if (!activeProfile) {
      return <AvatarFallback>A</AvatarFallback>;
    }
    const isUrl = activeProfile.profile_picture?.startsWith("http");

    if (isUrl) {
      return (
        <AvatarImage
          src={activeProfile.profile_picture}
          alt={activeProfile.username}
        />
      );
    }
    if (activeProfile.profile_picture) {
      return (
        <AvatarFallback className="bg-transparent text-lg">
          {getAvatarEmoji(activeProfile.profile_picture)}
        </AvatarFallback>
      );
    }
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

      <div className="mt-auto">
        <button
          onClick={() => navigate("/account/manage-profiles")}
          className="flex items-center w-full text-left space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors duration-200 text-gray-600 hover:bg-gray-100"
        >
          <Users className="w-6 h-6 text-primary" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Switch Profile</p>
          </div>
          <ChevronsRight className="w-4 h-4 text-gray-400" />
        </button>

        <NavLink
          to="/account"
          className={({ isActive }) =>
            cn(
              "flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors duration-200 text-gray-600 hover:bg-gray-100",
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
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600 space-x-3 px-4 py-3"
        >
          <LogOut className="w-6 h-6" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
};

export default SideNav;

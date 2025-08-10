import React from "react";
import { NavLink } from "react-router-dom";
import { Home, HeartPulse, PlayCircle, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarEmoji } from "@/lib/utils";

const navLinks = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/services", icon: HeartPulse, label: "Services" },
  { to: "/videos", icon: PlayCircle, label: "Videos" },
  { to: "/history", icon: History, label: "History" },
];

const BottomNav = () => {
  const { activeProfile } = useAuth();
  const firstName = activeProfile?.username?.split(" ")[0] || "Account";

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
    return <AvatarFallback>{firstName.charAt(0).toUpperCase()}</AvatarFallback>;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto bg-white border-t border-gray-200 z-40 md:hidden">
      <div className="flex justify-around items-center h-20">
        {navLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center text-gray-500 hover:text-primary transition-colors w-full h-full",
                isActive ? "text-primary" : ""
              )
            }
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
        <NavLink
          to="/account"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center text-gray-500 hover:text-primary transition-colors w-full h-full",
              isActive ? "text-primary" : ""
            )
          }
        >
          <Avatar className="w-7 h-7 mb-1">{renderAvatar()}</Avatar>
          <span className="text-xs font-medium">{firstName}</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;

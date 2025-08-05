import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Heart, Video, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/services', label: 'Services', icon: Heart },
  { path: '/videos', label: 'Videos', icon: Video },
  { path: '/history', label: 'History', icon: History },
  { path: '/profile', label: 'Profile', icon: User },
];

const MainLayout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="mobile-container">
      <main className="page-content">{children}</main>
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn('nav-item', isActive && 'active')}
          >
            <div className="nav-icon-container">
              <item.icon className="w-6 h-6" />
            </div>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default MainLayout;
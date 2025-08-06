import React from 'react';
import whiteLogo from '@/assets/images/white_logo.svg';
import coloredLogo from '@/assets/images/colored_logo.svg';

const NetLifeLogo = ({ className = "w-16 h-16", variant = "dark" }) => {
  // Use white logo for dark/colored backgrounds, colored logo for white backgrounds
  const logoSrc = variant === "white" ? whiteLogo : coloredLogo;
  
  return (
    <div className={`${className} flex items-center justify-center`}>
      <img src={logoSrc} alt="NetLife Logo" className="w-full h-full object-contain" />
    </div>
  );
};

export default NetLifeLogo;
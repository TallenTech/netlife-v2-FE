import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll the main window to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });

    // Also scroll the main content area (for the layout with fixed sidebar)
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }

    // Handle mobile container scrolling
    const mobileContainer = document.querySelector('.mobile-container');
    if (mobileContainer) {
      mobileContainer.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }

    // Force scroll to top after a small delay to ensure all content is loaded
    setTimeout(() => {
      window.scrollTo(0, 0);
      if (mainContent) mainContent.scrollTo(0, 0);
      if (mobileContainer) mobileContainer.scrollTo(0, 0);
    }, 100);

  }, [pathname]);

  return null;
};

export default ScrollToTop;
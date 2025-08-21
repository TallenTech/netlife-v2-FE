import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when component mounts
    const scrollToTop = () => {
      // Scroll the main window
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });

      // Scroll the main content area
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      }

      // Scroll mobile container
      const mobileContainer = document.querySelector('.mobile-container');
      if (mobileContainer) {
        mobileContainer.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      }
    };

    // Execute immediately
    scrollToTop();

    // Also execute after a small delay to ensure content is rendered
    const timeoutId = setTimeout(scrollToTop, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname]);
};

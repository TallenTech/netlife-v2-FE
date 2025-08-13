import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';

const WhatsAppFloat = ({ 
  phoneNumber = "+256758361967", // Replace with your actual WhatsApp number
  message = "Hi! I need help with NetLife services.",
  position = "bottom-right",
  showTooltip: showTooltipProp = true 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Position classes - adjusted for better mobile positioning
  const positionClasses = {
    "bottom-right": "bottom-24 right-3 md:bottom-6 md:right-6",
    "bottom-left": "bottom-24 left-3 md:bottom-6 md:left-6", 
    "top-right": "top-20 right-3 md:top-6 md:right-6",
    "top-left": "top-20 left-3 md:top-6 md:left-6"
  };
  
  const handleWhatsAppClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('WhatsApp button clicked!'); // Debug log
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodedMessage}`;
    
    console.log('Opening WhatsApp URL:', whatsappUrl); // Debug log
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      {/* Floating WhatsApp Button */}
      <motion.div
        className={`fixed ${positionClasses[position]} z-50`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 0.5 
        }}
        style={{ zIndex: 9999 }}
      >
        <div className="relative">
          {/* Tooltip */}
          {showTooltipProp && (
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, x: 10, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-14 md:right-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-2 py-1 md:px-3 md:py-2 rounded-lg text-xs md:text-sm whitespace-nowrap shadow-lg"
                >
                  Need help? Chat with us!
                  <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Pulse animation - behind button */}
          <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20 pointer-events-none"></div>
          
          {/* WhatsApp Button - smaller and less intrusive */}
          <motion.button
            onClick={handleWhatsAppClick}
            onMouseEnter={() => showTooltipProp && setShowTooltip(true)}
            onMouseLeave={() => showTooltipProp && setShowTooltip(false)}
            className="relative w-12 h-12 md:w-14 md:h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-md hover:shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer z-10"
            whileHover={{ 
              boxShadow: "0 8px 20px rgba(34, 197, 94, 0.3)" 
            }}
            whileTap={{ scale: 0.9 }}
            aria-label="Contact us on WhatsApp"
            type="button"
          >
            <WhatsAppIcon className="w-5 h-5 md:w-7 md:h-7" />
          </motion.button>
        </div>
      </motion.div>
    </>
  );
};

export default WhatsAppFloat;
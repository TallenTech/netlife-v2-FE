import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const MobileConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive", // "destructive" or "default"
  icon: Icon = AlertTriangle,
  isLoading = false
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700'
        };
      default:
        return {
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          confirmButton: 'bg-primary hover:bg-primary/90'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <>
      {/* Mobile Modal - Custom slide-up implementation */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden fixed inset-0 bg-black/50 z-[9998]"
              onClick={onClose}
            />

            {/* Mobile Modal - Slides from bottom */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 300,
                duration: 0.4 
              }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Handle Bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>

              <div className="px-6 pb-8 pt-4" style={{ pointerEvents: 'auto' }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="text-center mb-8"
                >
                  <div className={`w-20 h-20 ${styles.iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                    <Icon className={`w-10 h-10 ${styles.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {title}
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed px-2">
                    {description}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="space-y-4"
                  style={{ pointerEvents: 'auto' }}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onConfirm();
                    }}
                    disabled={isLoading}
                    className={`w-full h-14 ${styles.confirmButton} text-white font-bold text-lg rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative z-50`}
                    style={{ pointerEvents: 'auto' }}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Processing...
                      </div>
                    ) : (
                      confirmText
                    )}
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onClose();
                    }}
                    disabled={isLoading}
                    className="w-full h-14 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold text-lg rounded-2xl bg-white disabled:opacity-50 disabled:cursor-not-allowed relative z-50"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <X className="w-6 h-6 mr-3 inline" />
                    {cancelText}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Modal - Use original AlertDialog component */}
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="hidden md:block max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Icon className={`w-5 h-5 ${styles.iconColor}`} />
              <span>{title}</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isLoading}
              className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                confirmText
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MobileConfirmDialog;
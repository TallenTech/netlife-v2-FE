import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

const SurveyCompletionDialog = ({ 
  isOpen, 
  onClose, 
  userId, 
  onCompletion 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompletion = async (completed) => {
    setIsSubmitting(true);
    
    try {
      if (completed) {
        // Update the most recent started survey to completed
        const { data: startedSurveys, error: fetchError } = await supabase
          .from('user_survey_completions')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'started')
          .order('started_at', { ascending: false })
          .limit(1);

        if (fetchError) {
          console.error('Error fetching started survey:', fetchError);
          return;
        }

        if (startedSurveys && startedSurveys.length > 0) {
          // Update to completed
          const { error: updateError } = await supabase
            .from('user_survey_completions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', startedSurveys[0].id);

          if (updateError) {
            console.error('Error updating survey completion:', updateError);
            return;
          }
        }
      } else {
        // Mark as abandoned
        const { error: abandonError } = await supabase
          .from('user_survey_completions')
          .update({
            status: 'abandoned'
          })
          .eq('user_id', userId)
          .eq('status', 'started')
          .order('started_at', { ascending: false })
          .limit(1);

        if (abandonError) {
          console.error('Error marking survey as abandoned:', abandonError);
        }
      }

      // Clear localStorage
      localStorage.removeItem('survey_started');
      
      // Notify parent component
      onCompletion(completed);
      onClose();
      
    } catch (error) {
      console.error('Error handling survey completion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              className="md:hidden fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm"
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
              {/* Mobile Handle Bar and Close Button */}
              <div className="flex justify-between items-center pt-3 pb-2 px-6">
                <div></div>
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="px-6 pb-8 pt-4 safe-area-inset-bottom">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="text-center mb-8"
                >
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Welcome back! 👋
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed px-2">
                    We noticed you started the health assessment. Did you complete it successfully?
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="space-y-4"
                >
                  <Button
                    onClick={() => handleCompletion(true)}
                    disabled={isSubmitting}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-2xl shadow-lg"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Updating...
                      </div>
                    ) : (
                      <>
                        <CheckCircle className="w-6 h-6 mr-3" />
                        Yes, I completed it! ✨
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => handleCompletion(false)}
                    disabled={isSubmitting}
                    variant="outline"
                    className="w-full h-14 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold text-lg rounded-2xl"
                  >
                    <X className="w-6 h-6 mr-3" />
                    No, I didn't finish it
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className="mt-6 text-center"
                >
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Don't worry - you can always take the assessment later if you didn't complete it.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Modal - Use original Dialog component for proper centering */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="hidden md:block max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-gray-900">
              Health Assessment Status
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Welcome back! 👋
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We noticed you started the health assessment. Did you complete it successfully?
              </p>
            </motion.div>

            <div className="space-y-3">
              <Button
                onClick={() => handleCompletion(true)}
                disabled={isSubmitting}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Yes, I completed it! ✨
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => handleCompletion(false)}
                disabled={isSubmitting}
                variant="outline"
                className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-xl"
              >
                <X className="w-5 h-5 mr-2" />
                No, I didn't finish it
              </Button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Don't worry - you can always take the assessment later if you didn't complete it.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SurveyCompletionDialog;
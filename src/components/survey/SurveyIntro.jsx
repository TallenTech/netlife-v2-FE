import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Clock, CheckCircle, Smartphone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const SurveyIntro = ({ onBack }) => {
  const { activeProfile } = useAuth();
  const [lastSurveyDate, setLastSurveyDate] = useState(null);
  const [canTakeSurvey, setCanTakeSurvey] = useState(true);
  const [daysUntilNext, setDaysUntilNext] = useState(0);
  
  // Get user's first name for personalization
  const getUserFirstName = () => {
    if (activeProfile?.username) {
      return activeProfile.username.split(' ')[0];
    }
    return 'Friend'; // Fallback if no name available
  };

  // Check if user can take survey (90-day interval)
  useEffect(() => {
    const checkSurveyEligibility = async () => {
      if (!activeProfile?.id) return;

      try {
        // Check if user has completed a survey within 90 days
        const { data, error } = await supabase
          .from('user_survey_completions')
          .select('completed_at, started_at, status')
          .eq('user_id', activeProfile.id)
          .eq('status', 'completed') // Only check completed surveys
          .order('completed_at', { ascending: false })
          .limit(1);

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking survey eligibility:', error);
          return;
        }

        if (data && data.length > 0) {
          const lastCompleted = new Date(data[0].completed_at);
          const now = new Date();
          const daysSinceLastSurvey = Math.floor((now - lastCompleted) / (1000 * 60 * 60 * 24));
          
          setLastSurveyDate(lastCompleted);
          
          if (daysSinceLastSurvey < 90) {
            setCanTakeSurvey(false);
            setDaysUntilNext(90 - daysSinceLastSurvey);
          }
        }
      } catch (error) {
        console.error('Error checking survey eligibility:', error);
      }
    };

    checkSurveyEligibility();
  }, [activeProfile]);

  const handleStartSurvey = async () => {
    if (!canTakeSurvey) return;

    try {
      // Record that user started the survey (not completed yet)
      await supabase
        .from('user_survey_completions')
        .insert({
          user_id: activeProfile.id,
          started_at: new Date().toISOString(),
          status: 'started',
          survey_url: 'https://crane.netlife.cc/index.php/471791'
        });

      // Store in localStorage that user started survey (for return detection)
      localStorage.setItem('survey_started', JSON.stringify({
        userId: activeProfile.id,
        startedAt: new Date().toISOString(),
        surveyUrl: 'https://crane.netlife.cc/index.php/471791'
      }));

      // Open external survey
      window.open('https://crane.netlife.cc/index.php/471791', '_blank');
    } catch (error) {
      console.error('Error recording survey start:', error);
      // Still open survey even if recording fails
      window.open('https://crane.netlife.cc/index.php/471791', '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col min-h-screen">
        {/* Simple Header with back button */}
        <div className="bg-white border-b border-gray-100">
          <div className="flex items-center px-4 py-3">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main content container - mobile optimized */}
        <div className="flex-1 flex flex-col px-3 md:px-6 pb-4 md:pb-6 max-w-2xl mx-auto w-full pt-4 md:pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6 md:mb-10"
          >
            <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-6 leading-tight">
              Welcome <span className="username-gradient">{getUserFirstName()}</span>
            </h1>
            <p className="text-sm md:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto px-2 md:px-4">
              Your health and wellbeing matter to us. This caring assessment helps us understand how we can best support you on your health journey - with love, no judgment, and complete privacy.
            </p>
          </motion.div>

          {/* Mobile-specific warning */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="md:hidden mb-6"
          >
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Smartphone className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-900 text-sm mb-1">📱 Better on Larger Screens</h3>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    This survey works best on tablets or laptops. If you're on a phone, consider switching to a larger device for the best experience.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Survey frequency information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-6 md:mb-8"
          >
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-purple-900 text-sm md:text-base mb-1">Every 3 Months</h3>
                  <p className="text-xs md:text-sm text-purple-700 leading-relaxed">
                    We ask you to take this assessment every 90 days to keep your health recommendations current and personalized.
                    {lastSurveyDate && (
                      <span className="block mt-1 text-purple-600">
                        Last completed: {lastSurveyDate.toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Survey not available message */}
          {!canTakeSurvey && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-6 md:mb-8"
            >
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-900 text-sm md:text-base mb-2">
                    You're All Set! ✨
                  </h3>
                  <p className="text-xs md:text-sm text-green-700 leading-relaxed">
                    You've recently completed your health assessment. Your next assessment will be available in {daysUntilNext} days.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Key Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-4 md:space-y-6 mb-8 md:mb-10"
          >
            <div className="grid gap-4 md:gap-6">
              <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Safe & Private Space</h3>
                  <p className="text-sm text-gray-600">This is your safe space. Everything you share stays completely private and secure.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Gentle & Simple</h3>
                  <p className="text-sm text-gray-600">Just 5-10 minutes of your time with caring, easy-to-answer questions.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Made Just for You</h3>
                  <p className="text-sm text-gray-600">Receive caring recommendations and support tailored specifically to your needs.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="space-y-4"
          >
            <div className="text-center">
              <p className="text-xs md:text-sm text-gray-500 mb-4">
                {canTakeSurvey 
                  ? "Ready to take this step together? We'll open the survey in a new tab. For the best experience, use a tablet or laptop if available."
                  : "Thank you for completing your recent assessment. We'll remind you when it's time for your next one."
                }
              </p>
            </div>
            
            <Button
              onClick={handleStartSurvey}
              disabled={!canTakeSurvey}
              className={`w-full h-12 md:h-16 font-bold text-base md:text-xl rounded-xl shadow-lg transition-all duration-200 ${
                canTakeSurvey 
                  ? 'bg-primary text-white hover:bg-primary/90 hover:shadow-xl' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canTakeSurvey ? 'Begin My Journey 🌟' : `Next Survey in ${daysUntilNext} Days`}
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-gray-400">
                We're honored you trust us with your health journey. Your privacy is sacred to us.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SurveyIntro;
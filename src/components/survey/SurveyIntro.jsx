import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Volume2, Play, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const SurveyIntro = ({ onStart, onBack }) => {
  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col min-h-screen">
        {/* Compact Sticky Header with back button and progress bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
          {/* Header with back button - minimal padding */}
          <div className="flex items-center px-3 py-2">
            <button
              onClick={onBack}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all"
            >
              <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Progress bar - minimal padding */}
          <div className="px-3 pb-3 max-w-4xl mx-auto w-full">
            <Progress value={0} className="h-1.5 md:h-2" />
          </div>
        </div>

        {/* Main content container - centered with reasonable width */}
        <div className="flex-1 flex flex-col px-4 md:px-6 pb-6 max-w-2xl mx-auto w-full pt-4 md:pt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6 md:mb-8"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary to-secondary-cyan rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center">
                <Volume2 className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 md:mb-4">Welcome to Your Health Assessment</h1>
            <p className="text-sm md:text-base lg:text-lg text-gray-600 leading-relaxed max-w-lg mx-auto px-2">
              This confidential survey will help personalize your NetLife experience.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-gray-50 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 border"
          >
            <div className="flex items-center justify-center mb-3 md:mb-4">
              <Volume2 className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <h3 className="text-sm md:text-base font-semibold text-gray-800 text-center mb-2">Audio Question Preview</h3>

            <div className="space-y-3 md:space-y-4">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '0%' }}></div>
              </div>

              <div className="flex items-center justify-between text-gray-500 text-xs md:text-sm">
                <span>0:00</span>
                <span>0:00</span>
              </div>

              <div className="audio-controls">
                <button className="audio-button"><SkipBack className="w-4 h-4 md:w-5 md:h-5" /></button>
                <button className="audio-button"><RotateCcw className="w-4 h-4 md:w-5 md:h-5" /></button>
                <button className="audio-button primary"><Play className="w-5 h-5 md:w-6 md:h-6" /></button>
                <button className="audio-button"><SkipForward className="w-4 h-4 md:w-5 md:h-5" /></button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-auto"
          >
            <Button
              onClick={onStart}
              className="w-full h-12 md:h-14 bg-primary text-white hover:bg-primary/90 font-semibold text-base md:text-lg rounded-xl"
            >
              Start Survey
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SurveyIntro;
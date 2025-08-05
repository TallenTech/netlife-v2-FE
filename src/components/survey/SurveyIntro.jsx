import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Volume2, Play, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import NetLifeLogo from '@/components/NetLifeLogo';

const SurveyIntro = ({ onStart, onBack }) => {
  return (
    <div className="mobile-container bg-white">
      <div className="h-screen flex flex-col">
        <div className="flex items-center justify-between p-6 pt-12">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <NetLifeLogo className="w-12 h-12" />
        </div>

        <div className="px-6 mb-6">
          <Progress value={0} className="h-2" />
        </div>

        <div className="flex-1 flex flex-col px-6 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary-cyan rounded-2xl flex items-center justify-center mx-auto mb-6">
              <NetLifeLogo className="w-12 h-12" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Your Health Assessment</h1>
            <p className="text-gray-600 text-base leading-relaxed">
              This confidential survey will help personalize your NetLife experience.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-gray-50 rounded-2xl p-6 mb-8 border"
          >
            <div className="flex items-center justify-center mb-4">
              <Volume2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-gray-800 font-semibold text-center mb-2">Audio Question Preview</h3>
            
            <div className="space-y-4">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '0%' }}></div>
              </div>
              
              <div className="flex items-center justify-between text-gray-500 text-sm">
                <span>0:00</span>
                <span>0:00</span>
              </div>
              
              <div className="audio-controls">
                <button className="audio-button"><SkipBack className="w-5 h-5" /></button>
                <button className="audio-button"><RotateCcw className="w-5 h-5" /></button>
                <button className="audio-button primary"><Play className="w-6 h-6" /></button>
                <button className="audio-button"><SkipForward className="w-5 h-5" /></button>
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
              className="w-full h-14 bg-primary text-white hover:bg-primary/90 font-semibold text-lg rounded-xl"
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
import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, HeartPulse, FileLock as UserLock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NetLifeLogo from '@/components/NetLifeLogo';

const LandingPage = ({ onJoin }) => {
  return (
    <div className="mobile-container bg-gradient-to-br from-primary via-purple-600 to-secondary-teal text-white">
      <div className="h-screen flex flex-col justify-between p-8">
        <header className="flex items-center space-x-3">
          <NetLifeLogo className="w-10 h-10" />
          <span className="text-2xl font-bold font-lora">NetLife</span>
        </header>

        <main className="text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight drop-shadow-lg"
          >
            Your Health.
            <br />
            Your Privacy.
            <br />
            Your Power.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-white/90 max-w-sm mx-auto"
          >
            Access secure, stigma-free digital health services for everyone.
          </motion.p>
        </main>

        <footer className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-4 text-left"
          >
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-6 h-6 text-secondary-light-green" />
              <span className="font-semibold">Completely Confidential</span>
            </div>
            <div className="flex items-center space-x-3">
              <HeartPulse className="w-6 h-6 text-secondary-light-green" />
              <span className="font-semibold">Personalized Health Services</span>
            </div>
            <div className="flex items-center space-x-3">
              <UserLock className="w-6 h-6 text-secondary-light-green" />
              <span className="font-semibold">Anonymous & Secure</span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Button
              onClick={onJoin}
              className="w-full h-16 bg-white text-primary text-xl font-bold rounded-2xl shadow-2xl hover:bg-gray-200 transform hover:scale-105 transition-transform"
            >
              Join / Login
            </Button>
          </motion.div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
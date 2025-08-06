import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, HeartPulse, FileLock as UserLock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NetLifeLogo from '@/components/NetLifeLogo';

const LandingPage = ({ onJoin }) => {
  return (
    <>
      {/* Mobile Layout - Keep exactly as it was */}
      <div className="lg:hidden mobile-container bg-gradient-to-br from-primary via-purple-600 to-secondary-teal text-white">
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

      {/* Desktop Layout - New responsive design */}
      <div className="hidden lg:block min-h-screen bg-gradient-to-br from-primary via-purple-600 to-secondary-teal text-white">
        <div className="min-h-screen flex items-center justify-center px-8 py-12">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <header className="flex items-center space-x-3">
                <NetLifeLogo className="w-12 h-12" />
                <span className="text-3xl font-bold font-lora">NetLife</span>
              </header>

              <main className="space-y-6">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-4xl xl:text-5xl font-extrabold leading-tight drop-shadow-lg"
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
                  className="text-lg xl:text-xl text-white/90 max-w-xl leading-relaxed"
                >
                  Access secure, stigma-free digital health services for everyone. 
                  Take control of your health journey with complete privacy and personalized care.
                </motion.p>
              </main>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-3 max-w-sm"
              >
                <Button
                  onClick={onJoin}
                  className="flex-1 h-14 bg-white text-primary text-lg font-bold rounded-xl shadow-2xl hover:bg-gray-200 transform hover:scale-105 transition-all duration-200"
                >
                  Join / Login
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-14 border-2 border-white text-white text-lg font-bold rounded-xl hover:bg-white hover:text-primary transform hover:scale-105 transition-all duration-200"
                >
                  Learn More
                </Button>
              </motion.div>
            </div>

            {/* Right Column - Features */}
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="space-y-6"
              >
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 feature-card">
                  <div className="flex items-start space-x-4">
                    <div className="bg-secondary-light-green/20 p-3 rounded-xl">
                      <ShieldCheck className="w-6 h-6 text-secondary-light-green" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Completely Confidential</h3>
                      <p className="text-white/80 text-base leading-relaxed">
                        Your health information is encrypted and protected with military-grade security. 
                        No one can access your data without your explicit permission.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 feature-card">
                  <div className="flex items-start space-x-4">
                    <div className="bg-secondary-light-green/20 p-3 rounded-xl">
                      <HeartPulse className="w-6 h-6 text-secondary-light-green" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Personalized Health Services</h3>
                      <p className="text-white/80 text-base leading-relaxed">
                        Get tailored health recommendations and services based on your unique needs, 
                        preferences, and health goals.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 feature-card">
                  <div className="flex items-start space-x-4">
                    <div className="bg-secondary-light-green/20 p-3 rounded-xl">
                      <UserLock className="w-6 h-6 text-secondary-light-green" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Anonymous & Secure</h3>
                      <p className="text-white/80 text-base leading-relaxed">
                        Access health services without revealing your identity. 
                        Your privacy is our top priority, always.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingPage;
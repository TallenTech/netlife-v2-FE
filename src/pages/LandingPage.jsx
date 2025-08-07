import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, HeartPulse, FileLock as UserLock } from "lucide-react";
import { Button } from "@/components/ui/button";
import NetLifeLogo from "@/components/NetLifeLogo";

const LandingPage = ({ onJoin }) => {
  return (
    <>
      {/* Mobile Layout*/}
      <div className="lg:hidden mobile-container bg-gradient-to-br from-primary via-purple-600 to-secondary-teal text-white">
        <div className="h-screen flex flex-col justify-between p-8">
          <header className="flex items-center space-x-3">
            <NetLifeLogo className="w-20 h-10" variant="white" />
            {/* <span className="text-2xl font-bold font-lora">NetLife</span> */}
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
                <span className="font-semibold">
                  Personalized Health Services
                </span>
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
                Get Started
              </Button>
            </motion.div>
          </footer>
        </div>
      </div>

      {/* Desktop Layout - Fixed height, no scroll */}
      <div className="hidden lg:block h-screen bg-gradient-to-br from-primary via-purple-600 to-secondary-teal text-white overflow-hidden">
        {/* Top Header with Logo */}
        <header className="w-full px-8 py-4">
          <NetLifeLogo className="w-28 h-12" variant="white" />
        </header>

        <div className="h-full flex items-center justify-center px-8 -mt-16">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center w-full">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <main className="space-y-4">
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
                  className="text-base xl:text-lg text-white/90 max-w-lg leading-relaxed"
                >
                  Access secure, stigma-free digital health services for
                  everyone. Take control of your health journey with complete
                  privacy and personalized care.
                </motion.p>
              </main>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="max-w-xs"
              >
                <Button
                  onClick={onJoin}
                  className="w-full h-12 bg-white text-primary text-base font-bold rounded-xl shadow-2xl hover:bg-gray-200 transform hover:scale-105 transition-all duration-200"
                >
                  Get Started
                </Button>
              </motion.div>
            </div>

            {/* Right Column - Features */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="space-y-4"
              >
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 feature-card">
                  <div className="flex items-start space-x-3">
                    <div className="bg-secondary-light-green/20 p-2 rounded-lg">
                      <ShieldCheck className="w-5 h-5 text-secondary-light-green" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">
                        Completely Confidential
                      </h3>
                      <p className="text-white/80 text-sm leading-relaxed">
                        Your health information is encrypted and protected with
                        military-grade security. No one can access your data
                        without your explicit permission.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 feature-card">
                  <div className="flex items-start space-x-3">
                    <div className="bg-secondary-light-green/20 p-2 rounded-lg">
                      <HeartPulse className="w-5 h-5 text-secondary-light-green" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">
                        Personalized Health Services
                      </h3>
                      <p className="text-white/80 text-sm leading-relaxed">
                        Get tailored health recommendations and services based
                        on your unique needs, preferences, and health goals.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 feature-card">
                  <div className="flex items-start space-x-3">
                    <div className="bg-secondary-light-green/20 p-2 rounded-lg">
                      <UserLock className="w-5 h-5 text-secondary-light-green" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">
                        Anonymous & Secure
                      </h3>
                      <p className="text-white/80 text-sm leading-relaxed">
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

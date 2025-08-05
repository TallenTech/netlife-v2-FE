import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Lock, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NetLifeLogo from '@/components/NetLifeLogo';

const OnboardingSlider = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "NetLife",
      subtitle: "Your Health. Your Privacy. Your Power.",
      description: "Secure, stigma-free digital health services for everyone.",
      icon: <NetLifeLogo className="w-20 h-20" />
    },
    {
      title: "Private & Secure",
      subtitle: "Your data stays safe with you",
      description: "End-to-end encryption, anonymous surveys, and auto-delete options ensure your privacy.",
      icon: <Lock className="w-16 h-16 text-primary" />
    },
    {
      title: "Ready to Start?",
      subtitle: "Join thousands taking control of their health",
      description: "Access confidential testing, prevention resources, and support services.",
      icon: <Rocket className="w-16 h-16 text-primary" />
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const skipToEnd = () => {
    onComplete();
  };

  return (
    <div className="mobile-container bg-white">
      <div className="relative h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 bg-white flex flex-col justify-between p-6 border-4 border-primary/20 rounded-3xl m-2"
          >
            <div className="flex justify-end pt-4">
              <button
                onClick={skipToEnd}
                className="text-primary/80 hover:text-primary text-sm font-medium"
              >
                Skip
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {slides[currentSlide].icon}
              </motion.div>

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="space-y-4"
              >
                <h1 className="text-4xl font-bold text-primary font-lora">
                  {slides[currentSlide].title}
                </h1>
                <h2 className="text-xl text-gray-800/90 font-medium">
                  {slides[currentSlide].subtitle}
                </h2>
                <p className="text-gray-600/80 text-base leading-relaxed max-w-sm">
                  {slides[currentSlide].description}
                </p>
              </motion.div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  currentSlide === 0 
                    ? 'bg-primary/10 text-primary/30' 
                    : 'bg-primary/20 text-primary hover:bg-primary/30'
                }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="flex space-x-2">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide ? 'bg-primary' : 'bg-primary/40'
                    }`}
                  />
                ))}
              </div>

              {currentSlide === slides.length - 1 ? (
                <Button
                  onClick={nextSlide}
                  className="bg-primary text-white hover:bg-primary/90 font-semibold px-6"
                >
                  Get Started
                </Button>
              ) : (
                <button
                  onClick={nextSlide}
                  className="w-12 h-12 rounded-full bg-primary/20 text-primary hover:bg-primary/30 flex items-center justify-center transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingSlider;
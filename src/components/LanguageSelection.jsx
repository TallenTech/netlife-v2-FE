import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NetLifeLogo from '@/components/NetLifeLogo';

const LanguageSelection = ({ onBack, onContinue }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  const languages = [
    { code: 'english', name: 'English', native: 'English', flag: 'US' },
    { code: 'luganda', name: 'Luganda', native: 'Luganda', flag: 'UG' },
    { code: 'runyakole', name: 'Runyakole', native: 'Runyakole', flag: 'UG' },
    { code: 'luo', name: 'Luo', native: 'Luo', flag: 'UG' },
    { code: 'ateso', name: 'Ateso', native: 'Ateso', flag: 'UG' }
  ];

  const handleContinue = () => {
    localStorage.setItem('netlife_language', selectedLanguage);
    onContinue(selectedLanguage);
  };

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

        <div className="flex-1 flex flex-col px-6 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Language</h1>
            <p className="text-gray-600">Choose your preferred language</p>
          </motion.div>

          <div className="flex-1 space-y-3">
            {languages.map((language, index) => (
              <motion.button
                key={language.code}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                onClick={() => setSelectedLanguage(language.code)}
                className={`w-full p-4 rounded-xl flex items-center space-x-4 transition-all border-2 ${
                  selectedLanguage === language.code
                    ? 'bg-primary/10 text-primary border-primary'
                    : 'bg-gray-50 text-gray-800 hover:bg-gray-100 border-transparent'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary-teal flex items-center justify-center text-white font-bold text-sm">
                  {language.flag}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{language.name}</div>
                  <div className={`text-sm ${
                    selectedLanguage === language.code ? 'text-primary/70' : 'text-gray-500'
                  }`}>
                    {language.native}
                  </div>
                </div>
                {selectedLanguage === language.code && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className="mt-8"
          >
            <Button
              onClick={handleContinue}
              className="w-full h-14 bg-primary text-white hover:bg-primary/90 font-semibold text-lg rounded-xl"
            >
              Continue
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelection;
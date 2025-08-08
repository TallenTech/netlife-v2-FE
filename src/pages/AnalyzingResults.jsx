import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { FileSearch } from 'lucide-react';
import NetLifeLogo from '@/components/NetLifeLogo';

const AnalyzingResults = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(`/services/${serviceId}/results`);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, serviceId]);

  return (
    <>
      <Helmet>
        <title>Analyzing Results... - NetLife</title>
      </Helmet>
      <div className="bg-white min-h-screen">
        {/* Main content - responsive layout */}
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center max-w-4xl mx-auto">
          
          {/* Logo with animation */}
          {/* <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-secondary-teal flex items-center justify-center">
              <NetLifeLogo className="w-12 h-12 md:w-14 md:h-14" variant="white" />
            </div>
          </motion.div> */}
          
          {/* Animated icon */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror"
            }}
            className="mb-8"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <FileSearch className="w-10 h-10 md:w-12 md:h-12 text-primary" />
            </div>
          </motion.div>

          {/* Title and description */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900"
          >
            Analyzing Your Results
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-base md:text-lg text-gray-600 max-w-md mx-auto"
          >
            Just a moment while we personalize your recommendations...
          </motion.p>

          {/* Loading indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-8"
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AnalyzingResults;
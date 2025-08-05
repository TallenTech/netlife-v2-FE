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
      <div className="mobile-container bg-gradient-to-br from-primary to-secondary-teal">
        <div className="h-screen flex flex-col items-center justify-center text-white p-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <NetLifeLogo className="w-20 h-20 mx-auto mb-8" />
          </motion.div>
          
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
            <FileSearch className="w-24 h-24 text-white/80" />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-bold mb-4 drop-shadow-lg"
          >
            Analyzing Your Results
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-lg text-white/90"
          >
            Just a moment while we personalize your recommendations...
          </motion.p>
        </div>
      </div>
    </>
  );
};

export default AnalyzingResults;
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { screeningQuestions } from '@/data/screeningQuestions';
import { useUserData } from '@/contexts/UserDataContext';

const ServiceScreeningIntro = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { activeProfile } = useUserData();
  const serviceData = screeningQuestions[serviceId];

  if (!serviceData) {
    return <div>Service not found</div>;
  }
  
  const handleStart = () => {
    navigate(`/services/${serviceId}/screening`);
  };

  return (
    <>
      <Helmet>
        <title>Screening for {serviceData.title} - NetLife</title>
      </Helmet>
      <div className="mobile-container bg-gradient-to-br from-primary via-purple-500 to-secondary-teal">
        <div className="h-screen flex flex-col p-6 text-white">
          <header className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate('/services')} className="mr-2 text-white hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center mb-8 backdrop-blur-sm"
            >
              <FileText className="w-14 h-14 text-white" />
            </motion.div>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-2xl font-semibold mb-2"
            >
              Hi, <span className="font-bold">{activeProfile?.username || 'there'}</span>!
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-4xl font-bold mb-4 drop-shadow-lg"
            >
              {serviceData.title}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-lg text-white/90 max-w-sm"
            >
              Please answer a few confidential questions to check your eligibility for this service.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="w-full"
          >
            <Button
              onClick={handleStart}
              className="w-full h-16 bg-white text-primary text-lg font-bold rounded-xl shadow-lg hover:bg-gray-100"
            >
              Start Screening
            </Button>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ServiceScreeningIntro;
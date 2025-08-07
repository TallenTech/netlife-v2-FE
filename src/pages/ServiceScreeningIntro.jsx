import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { servicesApi, transformServiceData } from '@/services/servicesApi';
import { useUserData } from '@/contexts/UserDataContext';

const ServiceScreeningIntro = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { activeProfile } = useUserData();
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadService();
  }, [serviceId]);

  const loadService = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get services from cache first
      const cachedServices = localStorage.getItem('netlife_services_cache');
      let services = [];

      if (cachedServices) {
        try {
          const cached = JSON.parse(cachedServices);
          if (cached.data && Date.now() - cached.timestamp < 60 * 60 * 1000) {
            services = cached.data;
          }
        } catch (e) {
          console.warn('Failed to parse cached services');
        }
      }

      // If no cached services, fetch from API
      if (services.length === 0) {
        const fetchedServices = await servicesApi.getServices();
        services = fetchedServices.map(s => transformServiceData(s));
      }

      const foundService = services.find(s => s.id === serviceId);
      
      if (!foundService) {
        setError('Service not found');
        return;
      }

      setService(foundService);
    } catch (err) {
      console.error('Failed to load service:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    navigate(`/services/${serviceId}/screening`);
  };

  if (loading) {
    return (
      <div className="mobile-container bg-gradient-to-br from-primary via-purple-500 to-secondary-teal">
        <div className="h-screen flex flex-col items-center justify-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-white/90">Loading service information...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="mobile-container bg-gradient-to-br from-primary via-purple-500 to-secondary-teal">
        <div className="h-screen flex flex-col p-6 text-white">
          <header className="flex items-center mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/services')} className="mr-2 text-white hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </header>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <AlertCircle size={48} className="text-white/80 mb-4" />
            <h2 className="text-xl font-bold mb-2">Service Not Available</h2>
            <p className="text-white/90 mb-6">{error || 'The requested service could not be found.'}</p>
            <Button
              onClick={() => navigate('/services')}
              className="bg-white text-primary hover:bg-gray-100"
            >
              Back to Services
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Screening for {service.title} - NetLife</title>
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
              {service.title}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-lg text-white/90 max-w-sm mb-4"
            >
              {service.desc}
            </motion.p>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-base text-white/80 max-w-sm"
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
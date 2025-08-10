import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Heart, Shield, Calendar, Star, HeartPulse, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';
import NetLifeLogo from '@/components/NetLifeLogo';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { servicesApi, transformServiceData } from '@/services/servicesApi';
import { runConnectionTest } from '@/utils/testConnection';
import { testServiceMapping } from '@/utils/testServiceMapping';

// Add test function for questions
const testServiceQuestions = async (serviceId) => {
  try {
    console.log(`🧪 Testing questions for service: ${serviceId}`);
    const questions = await servicesApi.getServiceQuestions(serviceId);
    console.log(`📋 Found ${questions.length} questions:`, questions);
    return questions;
  } catch (error) {
    console.error('❌ Failed to fetch questions:', error);
    return [];
  }
};

// Icon mapping for database services
const iconMap = {
  'Heart': Heart,
  'Shield': Shield,
  'Calendar': Calendar,
  'Star': Star,
  'HeartPulse': HeartPulse,
  'UserCheck': UserCheck
};

// Fallback services for offline/error scenarios
const fallbackServices = [
  { id: 'hts', slug: 'hts', title: 'HIV Testing', desc: 'Quick and confidential', icon: Heart, category: 'routine', color: 'red' },
  { id: 'sti', slug: 'sti', title: 'STI Screening', desc: 'Comprehensive screening', icon: Shield, category: 'routine', color: 'blue' },
  { id: 'prep', slug: 'prep', title: 'PrEP Access', desc: 'Prevention medication', icon: Calendar, category: 'follow-up', color: 'green' },
  { id: 'pep', slug: 'pep', title: 'PEP Access', desc: 'Post-exposure treatment', icon: Star, category: 'urgent', color: 'yellow' },
  { id: 'art', slug: 'art', title: 'ART Support', desc: 'Treatment support', icon: HeartPulse, category: 'follow-up', color: 'purple' },
  { id: 'counselling', slug: 'counselling', title: 'Counseling', desc: 'Professional guidance', icon: UserCheck, category: 'routine', color: 'indigo' },
];

const filters = ['All', 'Urgent', 'Routine', 'Follow-up'];

const Services = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Debug environment variables
    console.log('🔍 Environment Variables Debug:');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    
    loadServices();
    
    // Run connection test in development
    if (import.meta.env.DEV) {
      setTimeout(() => {
        runConnectionTest();
        testServiceMapping();
      }, 1000);
    }
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to load from cache first for faster initial render
      const cachedServices = getCachedServices();
      if (cachedServices.length > 0) {
        setServices(cachedServices);
        setLoading(false);
      }
      
      // Fetch fresh data from API
      const data = await servicesApi.getServices();
      
      // Transform database services to match UI expectations
      const transformedServices = data.map(service => {
        const transformed = transformServiceData(service);
        return {
          ...transformed,
          icon: iconMap[transformed.icon] || Heart // Use mapped icon or fallback to Heart
        };
      });
      
      // Cache the services for offline use
      cacheServices(transformedServices);
      setServices(transformedServices);
      
    } catch (err) {
      console.error('Failed to load services:', err);
      setError(err.message);
      
      // Try to use cached services if available
      const cachedServices = getCachedServices();
      if (cachedServices.length > 0) {
        setServices(cachedServices);
      } else {
        // Use fallback services as last resort
        setServices(fallbackServices);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cache management functions
  const cacheServices = (servicesData) => {
    try {
      localStorage.setItem('netlife_services_cache', JSON.stringify({
        data: servicesData,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to cache services:', error);
    }
  };

  const getCachedServices = () => {
    try {
      const cached = localStorage.getItem('netlife_services_cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Use cache if it's less than 1 hour old
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          return data.map(service => ({
            ...service,
            icon: iconMap[service.icon] || Heart
          }));
        }
      }
    } catch (error) {
      console.warn('Failed to load cached services:', error);
    }
    return [];
  };

  const handleRequest = (service) => {
    // Test questions for this service in development
    if (import.meta.env.DEV) {
      testServiceQuestions(service.id);
    }
    // Use slug for navigation, fallback to ID if slug is not available
    const serviceIdentifier = service.slug || service.id;
    navigate(`/services/${serviceIdentifier}/intro`);
  };

  const handleRetry = () => {
    loadServices();
  };

  const filteredServices = activeFilter === 'All' 
    ? services 
    : services.filter(s => s.category === activeFilter.toLowerCase());

  // Loading skeleton component
  const ServiceSkeleton = () => (
    <div className="bg-gray-50 border p-4 rounded-2xl flex flex-col items-center text-center space-y-3 h-40 animate-pulse">
      <div className="w-14 h-14 rounded-full bg-gray-200"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="w-full h-8 bg-gray-200 rounded-lg"></div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Health Services - NetLife</title>
      </Helmet>
      <div className="p-6 bg-white min-h-screen">
        <header className="flex items-center space-x-3 mb-4">
         
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Health Services</h1>
            <p className="text-gray-500">Choose the service you need</p>
          </div>
        </header>

        {/* Error Banner */}
        {error && !loading && (
          <div className={`mb-4 p-3 border rounded-lg flex items-center space-x-2 ${
            error.includes('Database connection not configured') 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <AlertCircle size={16} className={`flex-shrink-0 ${
              error.includes('Database connection not configured') 
                ? 'text-blue-600' 
                : 'text-red-600'
            }`} />
            <div className="flex-1">
              <p className={`text-sm ${
                error.includes('Database connection not configured') 
                  ? 'text-blue-800' 
                  : 'text-red-800'
              }`}>
                {error.includes('Database connection not configured') 
                  ? 'Running in development mode' 
                  : 'Failed to load services from server'
                }
              </p>
              <p className={`text-xs ${
                error.includes('Database connection not configured') 
                  ? 'text-blue-600' 
                  : 'text-red-600'
              }`}>
                {error.includes('Database connection not configured') 
                  ? 'Using demo data. Configure Supabase in .env to connect to database.' 
                  : 'Showing cached services. Some may be outdated.'
                }
              </p>
            </div>
            {!error.includes('Database connection not configured') && (
              <Button 
                onClick={handleRetry} 
                size="sm" 
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <RefreshCw size={14} className="mr-1" />
                Retry
              </Button>
            )}
          </div>
        )}
        
        <div className="flex space-x-2 overflow-x-auto no-scrollbar mb-6">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex-shrink-0 ${
                activeFilter === filter
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <motion.div 
          layout
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mr-4">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, index) => (
              <ServiceSkeleton key={`skeleton-${index}`} />
            ))
          ) : filteredServices.length === 0 ? (
            // Empty state
            <div className="col-span-2 text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Heart size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Available</h3>
              <p className="text-gray-500 mb-4">
                {activeFilter === 'All' 
                  ? 'No health services are currently available.' 
                  : `No ${activeFilter.toLowerCase()} services are currently available.`
                }
              </p>
              <Button onClick={handleRetry} variant="outline">
                <RefreshCw size={16} className="mr-2" />
                Refresh Services
              </Button>
            </div>
          ) : (
            // Services grid
            filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-gray-50 border p-4 rounded-2xl flex flex-col items-center text-center space-y-3"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-${service.color}-100`}>
                  <service.icon size={28} className={`text-${service.color}-600`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{service.title}</h3>
                  <p className="text-xs text-gray-500">{service.desc}</p>
                </div>
                <Button onClick={() => handleRequest(service)} className="w-full bg-primary text-white rounded-lg">
                  Request Now
                </Button>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </>
  );
};

export default Services;
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Heart, Shield, Calendar, Star, HeartPulse, UserCheck } from 'lucide-react';
import NetLifeLogo from '@/components/NetLifeLogo';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const services = [
  { id: 'hts', title: 'HIV Testing', desc: 'Quick and confidential', icon: Heart, category: 'routine', color: 'red' },
  { id: 'sti', title: 'STI Screening', desc: 'Comprehensive screening', icon: Shield, category: 'routine', color: 'blue' },
  { id: 'prep', title: 'PrEP Access', desc: 'Prevention medication', icon: Calendar, category: 'follow-up', color: 'green' },
  { id: 'pep', title: 'PEP Access', desc: 'Post-exposure treatment', icon: Star, category: 'urgent', color: 'yellow' },
  { id: 'art', title: 'ART Support', desc: 'Treatment support', icon: HeartPulse, category: 'follow-up', color: 'purple' },
  { id: 'counselling', title: 'Counseling', desc: 'Professional guidance', icon: UserCheck, category: 'routine', color: 'indigo' },
];

const filters = ['All', 'Urgent', 'Routine', 'Follow-up'];

const Services = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const navigate = useNavigate();

  const handleRequest = (serviceId) => {
    navigate(`/services/${serviceId}/intro`);
  };

  const filteredServices = activeFilter === 'All' 
    ? services 
    : services.filter(s => s.category === activeFilter.toLowerCase());

  return (
    <>
      <Helmet>
        <title>Health Services - NetLife</title>
      </Helmet>
      <div className="p-6 bg-white min-h-screen">
        <header className="flex items-center space-x-3 mb-4">
          <NetLifeLogo className="w-10 h-10" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Health Services</h1>
            <p className="text-gray-500">Choose the service you need</p>
          </div>
        </header>
        
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
          className="grid grid-cols-2 gap-4">
          {filteredServices.map((service, index) => (
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
              <Button onClick={() => handleRequest(service.id)} className="w-full bg-primary text-white rounded-lg">
                Request Now
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </>
  );
};

export default Services;
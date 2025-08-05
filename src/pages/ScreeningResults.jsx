import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { screeningQuestions } from '@/data/screeningQuestions';
import { useUserData } from '@/contexts/UserDataContext';

const ScreeningResults = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const serviceData = screeningQuestions[serviceId];
  const [results, setResults] = useState(null);
  const { activeProfile } = useUserData();

  useEffect(() => {
    if (!activeProfile) return;
    const storedResults = localStorage.getItem(`screening_results_${serviceId}_${activeProfile.id}`);
    if (storedResults) {
      setResults(JSON.parse(storedResults));
    } else {
      navigate(`/services/${serviceId}/screening`);
    }
  }, [serviceId, navigate, activeProfile]);

  const handleCTA = () => {
    if (results.eligible) {
      navigate(`/services/${serviceId}/request`);
    } else {
      navigate('/videos');
    }
  };

  if (!results || !serviceData || !activeProfile) {
    return (
      <div className="mobile-container flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const { eligible, score } = results;
  const advisory = serviceData.advisory;
  const gradientClass = eligible 
    ? 'from-green-400 to-teal-400' 
    : 'from-red-400 to-orange-400';
  const firstName = activeProfile?.username?.split(' ')[0] || '';


  return (
    <>
      <Helmet>
        <title>Screening Results - {serviceData.title}</title>
      </Helmet>
      <div className="mobile-container bg-gray-50">
        <div className="min-h-screen flex flex-col p-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            {eligible ? (
              <CheckCircle className="w-24 h-24 text-green-500 mb-4" />
            ) : (
              <XCircle className="w-24 h-24 text-red-500 mb-4" />
            )}

            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
              Awesome, {firstName}! Here are your results.
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              For {serviceData.title}.
            </p>

            <div className={`w-52 h-52 rounded-full flex flex-col items-center justify-center mb-8 bg-gradient-to-br ${gradientClass} shadow-lg`}>
              <p className="text-6xl font-bold text-white drop-shadow-md">{score}%</p>
              <p className="font-semibold text-white/90 drop-shadow-sm">Urgency Score</p>
            </div>

            {eligible ? (
              <div className="bg-white border border-green-200 p-4 rounded-2xl shadow-sm">
                <p className="text-green-800 font-semibold text-base">
                  Your score indicates a need for this service. Please take action, {firstName}, and proceed to securely order the support you need.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                <h3 className="font-bold text-gray-800 text-lg">{advisory.title}</h3>
                <p className="text-gray-600 mt-2 text-base">{advisory.message}</p>
              </div>
            )}
          </motion.div>

          <div className="mt-auto space-y-3">
            <Button
              onClick={handleCTA}
              className={`w-full h-16 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-shadow ${eligible ? 'bg-gradient-to-r from-primary to-purple-500 text-white' : 'bg-gradient-to-r from-secondary-teal to-teal-500 text-white'}`}
            >
              {eligible ? `Proceed to Order` : advisory.cta}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              onClick={() => navigate('/services')}
              variant="ghost"
              className="w-full h-12"
            >
              Back to Services
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ScreeningResults;
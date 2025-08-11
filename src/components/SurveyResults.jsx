import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Heart, Play, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import NetLifeLogo from '@/components/NetLifeLogo';
import { useUserData } from '@/contexts/UserDataContext';

const SurveyResults = ({ onGoToDashboard }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { activeProfile } = useUserData();
  const [surveyData, setSurveyData] = useState(null);

  useEffect(() => {
    const profileId = activeProfile?.id || 'main';
    const storedSurvey = JSON.parse(localStorage.getItem(`netlife_health_survey_${profileId}`));
    if (storedSurvey) {
      setSurveyData(storedSurvey);
    } else {
      const mainSurvey = JSON.parse(localStorage.getItem(`netlife_health_survey_main`));
      setSurveyData(mainSurvey);
    }
  }, [activeProfile]);

  const handleActionClick = (action) => {
    toast({
      title: `Action: ${action}`,
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  if (!surveyData) {
    return (
      <div className="mobile-container flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <p className="text-gray-600 mb-4">No survey results found.</p>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const score = surveyData.score || 8;
  const firstName = activeProfile?.username?.split(' ')[0] || 'there';

  return (
    <div className="mobile-container bg-gray-50">
      <div className="min-h-screen flex flex-col">
        <div className="p-6 pt-8 flex items-center justify-center bg-gray-50">
          <NetLifeLogo className="w-10 h-10 text-primary" />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 mt-4"
          >
            <h1 className="text-2xl font-bold text-gray-900">Your Health Profile, {firstName}</h1>
            <p className="text-gray-500">Anonymous, personalized recommendations</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-secondary-light-green/50 p-8 rounded-2xl text-center mb-8"
          >
            <p className="font-semibold text-green-800">Prevention Score</p>
            <p className="text-6xl font-bold text-green-900 my-1">{score}/10</p>
            <p className="text-green-800">You're taking great care of your health!</p>
          </motion.div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Priority Recommendations</h3>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-xl border flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">Recommended: Regular Testing</p>
                  <p className="text-sm text-gray-500 mb-3">Schedule HIV/STI screening every 3 months</p>
                  <Button onClick={() => handleActionClick('Regular Testing')} size="sm" className="bg-primary text-white">Take Action</Button>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                  <Heart size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">Consider: PrEP Consultation</p>
                  <p className="text-sm text-gray-500 mb-3">Talk to a provider about prevention options</p>
                  <Button onClick={() => handleActionClick('PrEP Consultation')} size="sm" className="bg-primary text-white">Take Action</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recommended Videos</h3>
            <div className="space-y-2">
              <button onClick={() => navigate('/videos')} className="w-full bg-white p-3 rounded-xl border flex items-center space-x-4 text-left">
                <div className="w-12 h-12 bg-secondary-light-green/70 rounded-lg flex items-center justify-center">
                  <Play className="text-green-800" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">HIV Prevention Basics</p>
                  <p className="text-sm text-gray-500">3:45 <span className="ml-2 bg-gray-200 px-2 py-0.5 rounded-md text-xs">prevention</span></p>
                </div>
              </button>
               <button onClick={() => navigate('/videos')} className="w-full bg-white p-3 rounded-xl border flex items-center space-x-4 text-left">
                <div className="w-12 h-12 bg-secondary-light-green/70 rounded-lg flex items-center justify-center">
                  <Play className="text-green-800" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Understanding Testing</p>
                  <p className="text-sm text-gray-500">4:20 <span className="ml-2 bg-gray-200 px-2 py-0.5 rounded-md text-xs">testing</span></p>
                </div>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Access Services</h3>
            <div className="space-y-2">
              <button onClick={() => navigate('/services')} className="w-full bg-white p-4 rounded-xl border flex justify-between items-center text-left">
                <div>
                  <p className="font-semibold">HIV Testing</p>
                  <p className="text-sm text-gray-500">Nearby clinics</p>
                </div>
                <ChevronRight className="text-gray-400" />
              </button>
              <button onClick={() => navigate('/services')} className="w-full bg-white p-4 rounded-xl border flex justify-between items-center text-left">
                <div>
                  <p className="font-semibold">PrEP Access</p>
                  <p className="text-sm text-gray-500">Health centers</p>
                </div>
                <ChevronRight className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t sticky bottom-0">
          <Button
            onClick={onGoToDashboard}
            className="w-full h-14 bg-primary text-white hover:bg-primary/90 font-semibold text-lg rounded-xl"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SurveyResults;
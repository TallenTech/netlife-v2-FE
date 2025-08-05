import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { screeningQuestions } from '@/data/screeningQuestions';
import { useUserData } from '@/contexts/UserDataContext';

const ServiceScreening = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile } = useUserData();
  const serviceData = screeningQuestions[serviceId];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  if (!serviceData) {
    return <div>Service not found</div>;
  }
  
  if (!activeProfile) {
    return <div>Loading profile...</div>;
  }

  const handleAnswer = (answer) => {
    const newAnswers = { ...answers, [currentQuestionIndex]: answer };
    setAnswers(newAnswers);

    if (currentQuestionIndex < serviceData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      const yesCount = Object.values(newAnswers).filter(a => a === 'yes').length;
      const score = Math.round((yesCount / serviceData.questions.length) * 100);
      
      const results = {
        score,
        eligible: yesCount > 0,
        answers: newAnswers,
      };
      
      localStorage.setItem(`screening_results_${serviceId}_${activeProfile.id}`, JSON.stringify(results));
      navigate(`/services/${serviceId}/analyzing`);
    }
  };

  const progress = ((currentQuestionIndex + 1) / serviceData.questions.length) * 100;

  return (
    <>
      <Helmet>
        <title>Screening for {serviceData.title} - NetLife</title>
      </Helmet>
      <div className="mobile-container bg-gradient-to-b from-gray-50 to-white">
        <div className="h-screen flex flex-col p-6">
          <header className="flex items-center mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/services/${serviceId}/intro`)} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{serviceData.title}</h1>
              <p className="text-sm text-gray-500">Eligibility Screening</p>
            </div>
          </header>

          <div className="mb-4">
            <Progress value={progress} />
            <p className="text-sm text-gray-500 mt-2 text-center">
              Question {currentQuestionIndex + 1} of {serviceData.questions.length}
            </p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <p className="text-2xl md:text-3xl font-bold text-gray-800 mb-12 leading-tight">
                  {serviceData.questions[currentQuestionIndex]}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleAnswer('no')}
              className="h-28 bg-red-100 text-red-700 hover:bg-red-200 flex flex-col space-y-2 text-lg font-bold border-2 border-red-200 shadow-sm hover:shadow-md transition-all"
            >
              <X size={32} />
              <span>No</span>
            </Button>
            <Button
              onClick={() => handleAnswer('yes')}
              className="h-28 bg-green-100 text-green-700 hover:bg-green-200 flex flex-col space-y-2 text-lg font-bold border-2 border-green-200 shadow-sm hover:shadow-md transition-all"
            >
              <Check size={32} />
              <span>Yes</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceScreening;
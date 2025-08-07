import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { servicesApi, calculateEligibility } from '@/services/servicesApi';
import { useUserData } from '@/contexts/UserDataContext';

const ServiceScreening = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile } = useUserData();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    loadServiceQuestions();
  }, [serviceId]);

  const loadServiceQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch questions for this service
      const questionsData = await servicesApi.getServiceQuestions(serviceId);
      
      if (questionsData.length === 0) {
        setError('No screening questions found for this service.');
        return;
      }

      // For now, we'll assume yes/no questions and create options dynamically
      // Later we can enhance this to fetch actual options from question_options table
      const questionsWithOptions = questionsData.map(question => ({
        ...question,
        options: [
          { id: 'yes', text: 'Yes', value: 'yes' },
          { id: 'no', text: 'No', value: 'no' }
        ]
      }));

      setQuestions(questionsWithOptions);
    } catch (err) {
      console.error('Failed to load service questions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mobile-container bg-gradient-to-b from-gray-50 to-white">
        <div className="h-screen flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Loading screening questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-container bg-gradient-to-b from-gray-50 to-white">
        <div className="h-screen flex flex-col items-center justify-center p-6">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Questions</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft size={16} className="mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="mobile-container bg-gradient-to-b from-gray-50 to-white">
        <div className="h-screen flex flex-col items-center justify-center p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Questions Available</h2>
          <p className="text-gray-600 text-center mb-6">
            This service doesn't have any screening questions configured yet.
          </p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft size={16} className="mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!activeProfile) {
    return <div>Loading profile...</div>;
  }

  const handleAnswer = async (answer) => {
    const newAnswers = { ...answers, [currentQuestionIndex]: answer };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate eligibility using the API utility
      const eligibilityResult = calculateEligibility(newAnswers);
      
      const results = {
        score: eligibilityResult.score,
        eligible: eligibilityResult.eligible,
        answers: newAnswers,
      };
      
      // Save results to localStorage (maintaining existing pattern)
      localStorage.setItem(`screening_results_${serviceId}_${activeProfile.id}`, JSON.stringify(results));
      
      // TODO: Later we can save answers to database using servicesApi.saveScreeningAnswers()
      // For now, just navigate to results
      navigate(`/services/${serviceId}/analyzing`);
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <>
      <Helmet>
        <title>Service Screening - NetLife</title>
      </Helmet>
      <div className="mobile-container bg-gradient-to-b from-gray-50 to-white">
        <div className="h-screen flex flex-col p-6">
          <header className="flex items-center mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/services/${serviceId}/intro`)} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Health Screening</h1>
              <p className="text-sm text-gray-500">Eligibility Assessment</p>
            </div>
          </header>

          <div className="mb-4">
            <Progress value={progress} />
            <p className="text-sm text-gray-500 mt-2 text-center">
              Question {currentQuestionIndex + 1} of {questions.length}
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
                  {currentQuestion?.question_text}
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
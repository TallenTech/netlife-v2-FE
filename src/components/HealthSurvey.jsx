import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import NetLifeLogo from '@/components/NetLifeLogo';
import { useToast } from '@/components/ui/use-toast';
import SurveyIntro from '@/components/survey/SurveyIntro';
import SurveyQuestion from '@/components/survey/SurveyQuestion';
import { useNavigate, useParams } from 'react-router-dom';

const HealthSurvey = ({ onBack, onComplete }) => {
  const [currentStep, setCurrentStep] = useState('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profileId } = useParams();

  const surveyQuestions = [
    {
      id: 'q1',
      type: 'audio',
      question: 'How often do you engage in physical activity?',
      audioUrl: '/audio/question1.mp3',
      options: [
        { id: 'daily', text: 'Daily', icon: '🏃‍♂️' },
        { id: 'weekly', text: '2-3 times per week', icon: '🚶‍♀️' },
        { id: 'rarely', text: 'Rarely', icon: '🛋️' },
        { id: 'never', text: 'Never', icon: '❌' }
      ]
    },
    {
      id: 'q2',
      type: 'audio',
      question: 'How would you rate your stress levels?',
      audioUrl: '/audio/question2.mp3',
      options: [
        { id: 'low', text: 'Low stress', icon: '😌' },
        { id: 'moderate', text: 'Moderate stress', icon: '😐' },
        { id: 'high', text: 'High stress', icon: '😰' },
        { id: 'very-high', text: 'Very high stress', icon: '😵' }
      ]
    },
    {
      id: 'q3',
      type: 'audio',
      question: 'How many hours of sleep do you get per night?',
      audioUrl: '/audio/question3.mp3',
      options: [
        { id: 'less-5', text: 'Less than 5 hours', icon: '😴' },
        { id: '5-6', text: '5-6 hours', icon: '😪' },
        { id: '7-8', text: '7-8 hours', icon: '😊' },
        { id: 'more-8', text: 'More than 8 hours', icon: '😴' }
      ]
    }
  ];

  const handleAnswerSelect = (questionId, answerId) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const handleNext = () => {
    const currentQ = surveyQuestions[currentQuestion];
    if (!answers[currentQ.id]) {
      toast({
        title: "Please select an answer",
        description: "Choose an option before continuing",
        variant: "destructive"
      });
      return;
    }

    if (currentQuestion < surveyQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const score = Math.floor(Math.random() * 3) + 7;
      const results = {
        score,
        answers,
        recommendations: [
          'Regular STI testing recommended',
          'Consider stress management techniques',
          'Maintain regular exercise routine'
        ],
        completedAt: Date.now(),
        profileId: profileId
      };
      localStorage.setItem(`netlife_health_survey_${profileId}`, JSON.stringify(results));
      setCurrentStep('complete');
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (onBack) {
      onBack();
    } else {
      setCurrentStep('intro');
    }
  };

  if (currentStep === 'intro') {
    return <SurveyIntro onStart={() => setCurrentStep('survey')} onBack={onBack} />;
  }

  if (currentStep === 'complete') {
    return (
      <div className="mobile-container bg-white">
        <div className="h-screen flex flex-col">
          <div className="flex items-center justify-center p-6 pt-12">
            <NetLifeLogo className="w-12 h-12" />
          </div>
          <div className="px-6 mb-6">
            <Progress value={100} className="h-2" />
          </div>
          <div className="flex-1 flex flex-col px-6 pb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center my-auto"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Assessment Complete!</h1>
              <p className="text-gray-600 text-base leading-relaxed">
                Thank you for sharing this information with us.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-4 mt-auto"
            >
              <Button
                  onClick={onComplete}
                  className="w-full h-14 bg-primary text-white hover:bg-primary/90 font-semibold text-lg rounded-xl"
                >
                  View Results
                </Button>
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  className="w-full h-14 text-primary border-primary hover:bg-primary/5 font-semibold text-lg rounded-xl"
                >
                  Go to Dashboard
                </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-white">
      <div className="h-screen flex flex-col">
        <div className="flex items-center justify-between p-6 pt-12">
          <button
            onClick={handlePrevious}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <NetLifeLogo className="w-12 h-12" />
        </div>
        <div className="px-6 mb-6">
          <Progress value={((currentQuestion + 1) / surveyQuestions.length) * 100} className="h-2" />
          <p className="text-gray-600 text-sm mt-2">
            Question {currentQuestion + 1} of {surveyQuestions.length}
          </p>
        </div>
        <SurveyQuestion
          question={surveyQuestions[currentQuestion]}
          selectedAnswer={answers[surveyQuestions[currentQuestion].id]}
          onAnswerSelect={handleAnswerSelect}
          onNext={handleNext}
          isLastQuestion={currentQuestion === surveyQuestions.length - 1}
        />
      </div>
    </div>
  );
};

export default HealthSurvey;
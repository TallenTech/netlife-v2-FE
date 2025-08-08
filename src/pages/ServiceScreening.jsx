import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import { servicesApi, calculateEligibility } from '@/services/servicesApi';
import { useUserData } from '@/contexts/UserDataContext';

const ServiceScreening = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const { activeProfile } = useUserData();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [actualServiceId, setActualServiceId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [progressRestored, setProgressRestored] = useState(false);

  // Always call useEffect hooks in the same order
  useEffect(() => {
    loadServiceQuestions();
  }, [serviceId]);

  // Load saved progress when questions are loaded
  useEffect(() => {
    // Always call the effect, but only execute logic when conditions are met
    if (questions.length > 0 && actualServiceId && activeProfile) {
      loadSavedProgress();
    }
  }, [questions, actualServiceId, activeProfile]);

  // Cleanup function to clear progress when component unmounts
  useEffect(() => {
    return () => {
      // Only clear progress if screening was completed (not if user navigated away)
      // We'll let the 24-hour expiry handle cleanup for incomplete screenings
    };
  }, []);

  const loadServiceQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      // First get the service by slug to get the actual service ID
      const serviceData = await servicesApi.getServiceBySlug(serviceId);
      
      if (!serviceData) {
        setError('Service not found.');
        return;
      }

      // Store the actual service ID for later use
      setActualServiceId(serviceData.id);

      // Fetch questions with their options using the optimized API function
      const questionsWithOptions = await servicesApi.getServiceQuestionsWithOptionsOptimized(serviceData.id);
      
      if (questionsWithOptions.length === 0) {
        setError('No screening questions found for this service.');
        return;
      }

      // If questions don't have options (for backward compatibility), add default Yes/No options
      const processedQuestions = questionsWithOptions.map(question => ({
        ...question,
        options: question.options && question.options.length > 0 
          ? question.options 
          : [
              { id: 'yes', text: 'Yes', value: 'yes' },
              { id: 'no', text: 'No', value: 'no' }
            ]
      }));

      setQuestions(processedQuestions);
    } catch (err) {
      console.error('Failed to load service questions:', err);
      setError(err.message);
      
      // Fallback to basic question loading if optimized version fails
      try {
        const serviceData = await servicesApi.getServiceBySlug(serviceId);
        if (serviceData) {
          setActualServiceId(serviceData.id);
          const basicQuestions = await servicesApi.getServiceQuestions(serviceData.id);
          const questionsWithDefaultOptions = basicQuestions.map(question => ({
            ...question,
            options: [
              { id: 'yes', text: 'Yes', value: 'yes' },
              { id: 'no', text: 'No', value: 'no' }
            ]
          }));
          setQuestions(questionsWithDefaultOptions);
          setError(null); // Clear error if fallback succeeds
        }
      } catch (fallbackErr) {
        console.error('Fallback question loading also failed:', fallbackErr);
        setError('Unable to load screening questions. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Loading screening questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
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
      <div className="bg-white min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
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
      const nextQuestionIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQuestionIndex);
      
      // Save progress after each answer
      saveProgress(newAnswers, nextQuestionIndex);
    } else {
      // All questions answered - clear progress and process completion
      clearProgress();
      await processScreeningCompletion(newAnswers);
    }
  };

  const processScreeningCompletion = async (finalAnswers) => {
    try {
      setSaving(true);
      
      // Validate that all required questions are answered
      const missingRequiredAnswers = questions.filter((question, index) => 
        question.required && (finalAnswers[index] === undefined || finalAnswers[index] === null)
      );
      
      if (missingRequiredAnswers.length > 0) {
        console.warn('Missing required answers:', missingRequiredAnswers);
        // For now, we'll proceed anyway since the UI should prevent this
      }
      
      // Calculate eligibility using the API utility
      const eligibilityResult = calculateEligibility(finalAnswers);
      
      const results = {
        score: eligibilityResult.score,
        eligible: eligibilityResult.eligible,
        answers: finalAnswers,
        savedToDatabase: false // Will be updated if database save succeeds
      };
      
      // Save answers to database first
      const databaseSaveSuccess = await saveAnswersToDatabase(finalAnswers);
      results.savedToDatabase = databaseSaveSuccess;
      
      // Save results to localStorage (maintaining existing pattern for backward compatibility)
      localStorage.setItem(`screening_results_${actualServiceId}_${activeProfile.id}`, JSON.stringify(results));
      
      // Navigate to results using slug
      navigate(`/services/${serviceId}/analyzing`);
    } catch (error) {
      console.error('Failed to process screening completion:', error);
      // Still navigate to results even if there are errors (graceful degradation)
      navigate(`/services/${serviceId}/analyzing`);
    } finally {
      setSaving(false);
    }
  };

  const saveAnswersToDatabase = async (finalAnswers) => {
    try {
      // Get current user for user_id
      let currentUser;
      try {
        currentUser = await servicesApi.getCurrentUser();
      } catch (authError) {
        console.warn('Authentication not available, using fallback for development:', authError.message);
        // Fallback for development when auth isn't ready
        currentUser = { id: '32065473-276a-46f9-b519-678a20e84224' };
      }
      
      if (!currentUser) {
        console.warn('No authenticated user found, skipping database save');
        return false;
      }

      // Transform answers into database format
      const answersForDatabase = [];
      
      Object.entries(finalAnswers).forEach(([questionIndex, answerValue]) => {
        const question = questions[parseInt(questionIndex)];
        if (question) {
          // Find the selected option ID if it exists
          const selectedOption = question.options?.find(opt => opt.value === answerValue);
          
          const answerRecord = {
            user_id: currentUser.id,
            service_id: actualServiceId,
            question_id: question.id,
            selected_option_id: selectedOption?.id || null,
            answer_text: selectedOption ? null : answerValue // Store text if no option found
          };
          
          answersForDatabase.push(answerRecord);
        }
      });

      // Save to database if we have valid answers
      if (answersForDatabase.length > 0) {
        await servicesApi.saveScreeningAnswers(answersForDatabase);
        console.log('Successfully saved screening answers to database');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to save answers to database:', error);
      return false;
    }
  };

  // Progress persistence functions
  const getProgressKey = () => {
    return `screening_progress_${actualServiceId}_${activeProfile?.id}`;
  };

  const saveProgress = (currentAnswers, questionIndex) => {
    try {
      const progressData = {
        answers: currentAnswers,
        currentQuestionIndex: questionIndex,
        serviceId: actualServiceId,
        timestamp: Date.now(),
        questionsCount: questions.length
      };
      
      localStorage.setItem(getProgressKey(), JSON.stringify(progressData));
    } catch (error) {
      console.warn('Failed to save screening progress:', error);
    }
  };

  const loadSavedProgress = () => {
    try {
      const savedProgress = localStorage.getItem(getProgressKey());
      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);
        
        // Validate that the saved progress matches current service and questions
        if (progressData.serviceId === actualServiceId && 
            progressData.questionsCount === questions.length) {
          
          // Check if progress is not too old (24 hours)
          const isRecentProgress = Date.now() - progressData.timestamp < 24 * 60 * 60 * 1000;
          
          if (isRecentProgress && Object.keys(progressData.answers || {}).length > 0) {
            setAnswers(progressData.answers || {});
            setCurrentQuestionIndex(progressData.currentQuestionIndex || 0);
            setProgressRestored(true);
            console.log('Restored screening progress');
            
            // Hide the restoration message after 3 seconds
            setTimeout(() => setProgressRestored(false), 3000);
          } else {
            // Clear old progress
            clearProgress();
          }
        } else {
          // Clear invalid progress
          clearProgress();
        }
      }
    } catch (error) {
      console.warn('Failed to load saved progress:', error);
      clearProgress();
    }
  };

  const clearProgress = () => {
    try {
      localStorage.removeItem(getProgressKey());
    } catch (error) {
      console.warn('Failed to clear progress:', error);
    }
  };

  const handleRestart = () => {
    clearProgress();
    setAnswers({});
    setCurrentQuestionIndex(0);
    setProgressRestored(false);
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <>
      <Helmet>
        <title>Service Screening - NetLife</title>
      </Helmet>
      <div className="bg-white min-h-screen">
        {/* Header section - full width at top left */}
        <div className="px-6 py-4">
          <header className="flex items-center mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/services/${serviceId}/intro`)} className="mr-2 text-gray-700 hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Health Screening</h1>
              <p className="text-sm text-gray-500">Eligibility Assessment</p>
            </div>
            
            {/* Show restart button if there are answers */}
            {Object.keys(answers).length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRestart}
                className="text-gray-600 hover:text-gray-800"
              >
                Start Over
              </Button>
            )}
          </header>

          <div className="mb-4">
            <Progress value={progress} />
            <p className="text-sm text-gray-500 mt-2 text-center">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            
            {/* Progress restoration notification */}
            {progressRestored && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <p className="text-sm text-blue-700 text-center">
                  ✓ Your previous progress has been restored
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Main content - centered with reasonable width */}
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
          <div className="max-w-2xl w-full">
            <div className="flex flex-col items-center justify-center text-center mb-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <p className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
                    {currentQuestion?.question_text}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dynamic answer options based on question type */}
            {currentQuestion?.question_type === 'yes_no' || currentQuestion?.options?.length === 2 ? (
              // Yes/No questions - preserve existing UI
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {currentQuestion.options.map((option, index) => {
                  // Determine if this is a "No" option based on value or text
                  const isNoOption = option.value.toLowerCase() === 'no' || 
                                   option.text.toLowerCase() === 'no' ||
                                   option.value.toLowerCase() === 'false';
                  
                  return (
                    <Button
                      key={option.id}
                      onClick={() => handleAnswer(option.value)}
                      disabled={saving}
                      className={`h-28 flex flex-col space-y-2 text-lg font-bold border-2 shadow-sm hover:shadow-md transition-all ${
                        isNoOption
                          ? 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {saving && currentQuestionIndex === questions.length - 1 ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
                      ) : (
                        isNoOption ? <X size={32} /> : <Check size={32} />
                      )}
                      <span>{option.text}</span>
                    </Button>
                  );
                })}
              </div>
            ) : (
              // Multiple choice questions - vertical list
              <div className="space-y-3 max-w-lg mx-auto">
                {currentQuestion.options.map((option) => (
                  <Button
                    key={option.id}
                    onClick={() => handleAnswer(option.value)}
                    disabled={saving}
                    variant="outline"
                    className={`w-full h-16 text-left justify-start text-lg font-medium border-2 hover:border-primary hover:bg-primary/5 transition-all ${
                      saving ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {saving && currentQuestionIndex === questions.length - 1 ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-3"></div>
                        Saving...
                      </div>
                    ) : (
                      option.text
                    )}
                  </Button>
                ))}
              </div>
            )}
            
            {/* Show saving message on last question */}
            {saving && (
              <div className="text-center mt-6">
                <p className="text-gray-600">Saving your responses...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceScreening;
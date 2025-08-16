import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { calculateEligibility } from "@/services/servicesApi.utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  useServiceQuestions,
  useSaveScreeningResult,
  useSaveScreeningAnswers,
} from "@/hooks/useServiceQueries";

const ServiceScreening = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { activeProfile, user } = useAuth();

  const {
    data: questionsData,
    isLoading: loading,
    error,
  } = useServiceQuestions(serviceId);
  const { mutate: saveAnswersMutation } = useSaveScreeningAnswers();
  const { mutate: saveResultMutation, isLoading: saving } =
    useSaveScreeningResult();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [progressRestored, setProgressRestored] = useState(false);

  const questions = (questionsData || []).map((q) => ({
    ...q,
    options:
      q.options && q.options.length > 0
        ? q.options
        : [
            { id: "yes", text: "Yes", value: "yes" },
            { id: "no", text: "No", value: "no" },
          ],
  }));

  useEffect(() => {
    if (questions.length > 0 && activeProfile) {
      loadSavedProgress();
    }
  }, [questions, activeProfile]);

  const getProgressKey = () =>
    `screening_progress_${serviceId}_${activeProfile?.id}`;

  const saveProgress = (currentAnswers, questionIndex) => {
    if (!activeProfile) return;
    try {
      const progressData = {
        answers: currentAnswers,
        currentQuestionIndex: questionIndex,
        serviceId,
        timestamp: Date.now(),
        questionsCount: questions.length,
      };
      localStorage.setItem(getProgressKey(), JSON.stringify(progressData));
    } catch (e) {
      console.warn("Failed to save screening progress:", e);
    }
  };

  const loadSavedProgress = () => {
    if (!activeProfile) return;
    try {
      const saved = localStorage.getItem(getProgressKey());
      if (saved) {
        const progressData = JSON.parse(saved);
        if (
          progressData.serviceId === serviceId &&
          progressData.questionsCount === questions.length &&
          Date.now() - progressData.timestamp < 24 * 60 * 60 * 1000
        ) {
          setAnswers(progressData.answers || {});
          setCurrentQuestionIndex(progressData.currentQuestionIndex || 0);
          setProgressRestored(true);
          setTimeout(() => setProgressRestored(false), 3000);
        } else {
          clearProgress();
        }
      }
    } catch (e) {
      console.warn("Failed to load saved progress:", e);
      clearProgress();
    }
  };

  const clearProgress = () => {
    if (!activeProfile) return;
    try {
      localStorage.removeItem(getProgressKey());
    } catch (e) {
      console.warn("Failed to clear progress:", e);
    }
  };

  const handleAnswer = async (answer) => {
    const newAnswers = { ...answers, [currentQuestionIndex]: answer };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      saveProgress(newAnswers, nextIndex);
    } else {
      clearProgress();
      await processScreeningCompletion(newAnswers);
    }
  };

  const processScreeningCompletion = async (finalAnswers) => {
    const eligibilityResult = calculateEligibility(finalAnswers);
    const resultsPayload = {
      score: eligibilityResult.score,
      eligible: eligibilityResult.eligible,
      answers: finalAnswers,
      completedAt: new Date().toISOString(),
      serviceSlug: serviceId,
      serviceId: questions[0]?.service_id,
    };

    if (user && questions.length > 0) {
      const answersForDb = Object.entries(finalAnswers).map(
        ([qIndex, ansValue]) => ({
          user_id: user.id,
          service_id: questions[parseInt(qIndex)].service_id,
          question_id: questions[parseInt(qIndex)].id,
          answer_text: ansValue,
        })
      );
      saveAnswersMutation(answersForDb);

      const resultForDb = {
        user_id: user.id,
        service_id: questions[0].service_id,
        score: resultsPayload.score,
        eligible: resultsPayload.eligible,
        answers_summary: finalAnswers,
        completed_at: resultsPayload.completedAt,
      };
      saveResultMutation(resultForDb);
    }

    localStorage.setItem(
      `screening_results_${questions[0]?.service_id}_${activeProfile.id}`,
      JSON.stringify(resultsPayload)
    );
    navigate(`/services/${serviceId}/analyzing`);
  };

  const handleRestart = () => {
    clearProgress();
    setAnswers({});
    setCurrentQuestionIndex(0);
    setProgressRestored(false);
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4">Loading questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center text-center px-6">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Error</h2>
        <p className="text-gray-600 mb-6">{error.message}</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft size={16} className="mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <>
      <Helmet>
        <title>Service Screening - NetLife</title>
      </Helmet>
      <div className="bg-white min-h-screen">
        <div className="px-6 py-4">
          <header className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/services/${serviceId}/intro`)}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Health Screening</h1>
              <p className="text-sm text-gray-500">Eligibility Assessment</p>
            </div>
            {Object.keys(answers).length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleRestart}>
                Start Over
              </Button>
            )}
          </header>
          <div className="mb-4">
            <Progress value={progress} />
            <p className="text-sm text-gray-500 mt-2 text-center">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            {progressRestored && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <p className="text-sm text-blue-700 text-center">
                  ✓ Your progress has been restored
                </p>
              </motion.div>
            )}
          </div>
        </div>
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
            {currentQuestion?.options?.length === 2 ? (
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {currentQuestion.options.map((option) => {
                  const isNoOption =
                    option.value.toLowerCase() === "no" ||
                    option.text.toLowerCase() === "no";
                  return (
                    <Button
                      key={option.id}
                      onClick={() => handleAnswer(option.value)}
                      disabled={saving}
                      className={`h-28 flex flex-col space-y-2 text-lg font-bold border-2 shadow-sm hover:shadow-md ${
                        isNoOption
                          ? "bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                      }`}
                    >
                      {saving &&
                      currentQuestionIndex === questions.length - 1 ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
                      ) : isNoOption ? (
                        <X size={32} />
                      ) : (
                        <Check size={32} />
                      )}
                      <span>{option.text}</span>
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3 max-w-lg mx-auto">
                {currentQuestion?.options.map((option) => (
                  <Button
                    key={option.id}
                    onClick={() => handleAnswer(option.value)}
                    disabled={saving}
                    variant="outline"
                    className="w-full h-16 text-left justify-start text-lg font-medium border-2 hover:border-primary hover:bg-primary/5"
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

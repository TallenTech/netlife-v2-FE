import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SurveyQuestion = ({ question, selectedAnswer, onAnswerSelect, onNext, isLastQuestion }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30); // Mock duration

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            clearInterval(interval);
            setIsPlaying(false);
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [question.id]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleRestart = () => setCurrentTime(0);
  const handleSkipBack = () => setCurrentTime(Math.max(0, currentTime - 10));
  const handleSkipForward = () => setCurrentTime(Math.min(duration, currentTime + 10));

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col px-4 md:px-6 pb-6 max-w-2xl mx-auto w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col"
        >
          <div className="bg-gray-50 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 border">
            <div className="flex items-center justify-center mb-3 md:mb-4">
              <Volume2 className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <h3 className="text-sm md:text-base font-semibold text-gray-800 text-center mb-3 md:mb-4">Audio Question</h3>

            <div className="space-y-3 md:space-y-4">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
              </div>
              <div className="flex items-center justify-between text-gray-500 text-xs md:text-sm">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div className="audio-controls">
                <button onClick={handleSkipBack} className="audio-button"><SkipBack className="w-4 h-4 md:w-5 md:h-5" /></button>
                <button onClick={handleRestart} className="audio-button"><RotateCcw className="w-4 h-4 md:w-5 md:h-5" /></button>
                <button onClick={handlePlayPause} className="audio-button primary">
                  {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6" /> : <Play className="w-5 h-5 md:w-6 md:h-6" />}
                </button>
                <button onClick={handleSkipForward} className="audio-button"><SkipForward className="w-4 h-4 md:w-5 md:h-5" /></button>
              </div>
            </div>
          </div>

          <div className="text-center mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 max-w-lg mx-auto leading-relaxed px-2">{question.question}</h2>
          </div>

          <div className="flex-1 space-y-2.5 md:space-y-3">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => onAnswerSelect(question.id, option.id)}
                className={`w-full p-3 md:p-4 lg:p-5 rounded-xl flex items-center space-x-3 md:space-x-4 transition-all border-2 ${selectedAnswer === option.id
                  ? 'bg-primary/10 text-primary border-primary'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent'
                  }`}
              >
                <span className="text-xl md:text-2xl lg:text-3xl">{option.icon}</span>
                <span className="font-medium text-sm md:text-base lg:text-lg">{option.text}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 md:mt-6">
            <Button
              onClick={onNext}
              disabled={!selectedAnswer}
              className="w-full h-12 md:h-14 bg-primary text-white hover:bg-primary/90 font-semibold text-base md:text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLastQuestion ? 'Complete Survey' : 'Next Question'}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SurveyQuestion;
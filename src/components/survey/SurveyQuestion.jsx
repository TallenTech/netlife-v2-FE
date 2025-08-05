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
    <div className="flex-1 flex flex-col px-6 pb-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 border">
            <div className="flex items-center justify-center mb-4">
              <Volume2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-gray-800 font-semibold text-center mb-4">Audio Question</h3>
            
            <div className="space-y-4">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
              </div>
              <div className="flex items-center justify-between text-gray-500 text-sm">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div className="audio-controls">
                <button onClick={handleSkipBack} className="audio-button"><SkipBack className="w-5 h-5" /></button>
                <button onClick={handleRestart} className="audio-button"><RotateCcw className="w-5 h-5" /></button>
                <button onClick={handlePlayPause} className="audio-button primary">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                <button onClick={handleSkipForward} className="audio-button"><SkipForward className="w-5 h-5" /></button>
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{question.question}</h2>
          </div>

          <div className="flex-1 space-y-3">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => onAnswerSelect(question.id, option.id)}
                className={`w-full p-4 rounded-xl flex items-center space-x-4 transition-all border-2 ${
                  selectedAnswer === option.id
                    ? 'bg-primary/10 text-primary border-primary'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent'
                }`}
              >
                <span className="text-2xl">{option.icon}</span>
                <span className="font-medium">{option.text}</span>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <Button
              onClick={onNext}
              disabled={!selectedAnswer}
              className="w-full h-14 bg-primary text-white hover:bg-primary/90 font-semibold text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
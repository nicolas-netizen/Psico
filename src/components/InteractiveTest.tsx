import React, { useState, useEffect } from 'react';
import { Block, Option } from '../types/test';
import { motion } from 'framer-motion';
import { getOptimizedImageUrl } from '../utils/imageUtils';

interface InteractiveTestProps {
  block: Block;
  onComplete: (answers: number[]) => void;
  showTimer?: boolean;
}

const InteractiveTest: React.FC<InteractiveTestProps> = ({ block, onComplete, showTimer = true }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(block.timeLimit ? block.timeLimit * 60 : 0);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = block.questions[currentQuestionIndex];

  useEffect(() => {
    if (showTimer && timeLeft > 0 && !isComplete) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, isComplete]);

  const handleComplete = () => {
    setIsComplete(true);
    onComplete(answers);
  };

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);

    if (currentQuestionIndex < block.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleComplete();
    }
  };

  if (!currentQuestion || isComplete) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderOption = (option: Option, index: number) => {
    const isSelected = answers[currentQuestionIndex] === index;
    
    return (
      <motion.button
        key={option.id}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleAnswer(index)}
        className={`w-full p-4 mb-4 text-left rounded-lg transition-all ${
          isSelected
            ? 'bg-[#91c26a] text-white'
            : 'bg-white hover:bg-gray-50 border border-gray-200'
        }`}
      >
        <div className="flex items-center space-x-4">
          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border-2 border-current">
            {String.fromCharCode(65 + index)}
          </span>
          <div className="flex-grow">
            {option.text && <span className="block">{option.text}</span>}
            {option.imageUrl && (
              <img
                src={getOptimizedImageUrl(option.imageUrl, { width: 200, height: 150 })}
                alt={`Opción ${String.fromCharCode(65 + index)}`}
                className="mt-2 rounded-lg object-cover"
              />
            )}
          </div>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Barra de progreso y temporizador */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            Pregunta {currentQuestionIndex + 1} de {block.questions.length}
          </span>
          {showTimer && timeLeft > 0 && (
            <span className="text-sm font-medium text-gray-600">
              Tiempo restante: {formatTime(timeLeft)}
            </span>
          )}
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#91c26a] transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / block.questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Pregunta actual */}
      <div className="mb-8">
        {currentQuestion.type === 'mixed' || currentQuestion.type === 'text' ? (
          <h2 className="text-xl font-medium text-gray-800 mb-4">{currentQuestion.text}</h2>
        ) : null}
        
        {(currentQuestion.type === 'mixed' || currentQuestion.type === 'image') && currentQuestion.imageUrl && (
          <img
            src={getOptimizedImageUrl(currentQuestion.imageUrl, { width: 600 })}
            alt="Imagen de la pregunta"
            className="w-full rounded-lg shadow-lg mb-6 object-cover"
          />
        )}
      </div>

      {/* Opciones de respuesta */}
      <div className="space-y-4">
        {currentQuestion.options.map((option, index) => renderOption(option, index))}
      </div>
    </div>
  );
};

export default InteractiveTest;

import React from 'react';
import { motion } from 'framer-motion';
import { BlockType, BLOCK_NAMES } from '../../types/blocks';

interface Question {
  id: string;
  text: string;
  options: string[];
  type: string;
}

interface BlockPresentationProps {
  blockType: BlockType;
  description: string;
  questions: Question[];
  currentQuestionIndex: number;
  onAnswer: (questionId: string, answer: number) => void;
  timeRemaining?: number;
}

const BlockPresentation: React.FC<BlockPresentationProps> = ({
  blockType,
  description,
  questions,
  currentQuestionIndex,
  onAnswer,
  timeRemaining
}) => {
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Block Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          {BLOCK_NAMES[blockType]}
        </h2>
        <p className="text-lg text-gray-600 mb-4">{description}</p>
        {timeRemaining !== undefined && (
          <div className="text-lg font-semibold text-blue-600">
            Tiempo restante: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
        )}
      </motion.div>

      {/* Question Display */}
      {currentQuestion && (
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <p className="text-xl mb-6">
            {currentQuestionIndex + 1}. {currentQuestion.text}
          </p>
          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => onAnswer(currentQuestion.id, index)}
                className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
              >
                {option}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Progress Indicator */}
      <div className="mt-6">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        <p className="text-center mt-2 text-gray-600">
          Pregunta {currentQuestionIndex + 1} de {questions.length}
        </p>
      </div>
    </div>
  );
};

export default BlockPresentation;

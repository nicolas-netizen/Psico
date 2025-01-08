import React, { useState, useEffect, useCallback } from 'react';
import { Test, Question } from '../../types/Test';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface TestTakerProps {
  test: Test;
  onClose: () => void;
}

const TestTaker: React.FC<TestTakerProps> = ({ test, onClose }) => {
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(
    new Array(test.questions.length).fill(undefined)
  );
  const [timeRemaining, setTimeRemaining] = useState(test.timeLimit * 60);
  const [isTestCompleted, setIsTestCompleted] = useState(false);

  // Comprehensive test and user validation
  useEffect(() => {
    console.error('TestTaker Initialization Debug:', {
      user: user,
      test: test,
      userSubscription: user?.subscription,
      testQuestions: test.questions
    });

    if (!user) {
      toast.error('Debes iniciar sesión para realizar el test');
      onClose();
      return;
    }

    if (!test || !test.questions || test.questions.length === 0) {
      toast.error('Test no válido o sin preguntas');
      onClose();
      return;
    }

    // Validate test access
    const canAccessTest = test.plans?.some(
      planId => planId === user.subscription?.planId || 
      (user.subscription?.planName?.toLowerCase() === 'god')
    );

    if (!canAccessTest) {
      toast.error('No tienes acceso a este test con tu plan actual');
      onClose();
      return;
    }
  }, [user, test, onClose]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !isTestCompleted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (timeRemaining === 0) {
      handleSubmitTest();
    }
  }, [timeRemaining, isTestCompleted]);

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[questionIndex] = answerIndex;
    setSelectedAnswers(newSelectedAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitTest = useCallback(async () => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    // Calculate score
    const correctAnswers = test.questions.reduce((total, question, index) => {
      return selectedAnswers[index] === question.correctAnswerIndex 
        ? total + 1 
        : total;
    }, 0);

    const score = (correctAnswers / test.questions.length) * 100;

    try {
      // Save test result
      await api.saveTestResult({
        testId: test.id,
        userId: user.id,
        score: score,
        totalQuestions: test.questions.length,
        correctAnswers: correctAnswers,
        selectedAnswers: selectedAnswers,
        completedAt: new Date().toISOString()
      });

      // Update state
      setIsTestCompleted(true);
      toast.success(`Test completado. Puntuación: ${score.toFixed(2)}%`);
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Hubo un problema al guardar el resultado del test');
    }
  }, [test, user, selectedAnswers]);

  // Render current question
  const renderCurrentQuestion = () => {
    const currentQuestion = test.questions[currentQuestionIndex];
    
    return (
      <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Pregunta {currentQuestionIndex + 1} de {test.questions.length}
          </h2>
          <div className="text-red-500 font-bold">
            Tiempo restante: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <p className="text-gray-700 mb-4">{currentQuestion.text}</p>

        <div className="space-y-3">
          {currentQuestion.answers.map((answer, answerIndex) => (
            <button
              key={answerIndex}
              className={`
                w-full text-left p-3 rounded-md transition-colors duration-200
                ${selectedAnswers[currentQuestionIndex] === answerIndex 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 hover:bg-blue-100'}
              `}
              onClick={() => handleAnswerSelect(currentQuestionIndex, answerIndex)}
            >
              {answer}
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-6">
          <button 
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md disabled:opacity-50"
          >
            Anterior
          </button>
          
          {currentQuestionIndex === test.questions.length - 1 ? (
            <button 
              onClick={handleSubmitTest}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Finalizar Test
            </button>
          ) : (
            <button 
              onClick={handleNextQuestion}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render test results
  const renderTestResults = () => {
    const correctAnswers = test.questions.reduce((total, question, index) => {
      return selectedAnswers[index] === question.correctAnswerIndex 
        ? total + 1 
        : total;
    }, 0);

    const score = (correctAnswers / test.questions.length) * 100;

    return (
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Resultados del Test</h2>
        
        <div className="mb-6">
          <p className="text-lg text-gray-700">Puntuación Total:</p>
          <p className={`
            text-4xl font-bold 
            ${score >= 70 ? 'text-green-600' : 'text-red-600'}
          `}>
            {score.toFixed(2)}%
          </p>
        </div>

        <div className="flex justify-between mb-4">
          <p className="text-gray-700">Preguntas Totales:</p>
          <p className="font-semibold">{test.questions.length}</p>
        </div>

        <div className="flex justify-between mb-4">
          <p className="text-gray-700">Respuestas Correctas:</p>
          <p className="font-semibold text-green-600">{correctAnswers}</p>
        </div>

        <div className="flex justify-between mb-6">
          <p className="text-gray-700">Respuestas Incorrectas:</p>
          <p className="font-semibold text-red-600">
            {test.questions.length - correctAnswers}
          </p>
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
        >
          Volver al Listado de Tests
        </button>
      </div>
    );
  };

  // Main render method
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        {isTestCompleted 
          ? renderTestResults() 
          : renderCurrentQuestion()}
      </div>
    </div>
  );
};

export default TestTaker;

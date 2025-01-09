import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Test, 
  TestQuestion, 
  UserAnswer, 
  QuestionCategory, 
  QuestionDifficulty 
} from '../../types/Test';
import { useAuth } from '../../context/AuthContext';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft 
} from 'lucide-react';

const categoryIcons = {
  [QuestionCategory.MATHEMATICAL]: '🔢',
  [QuestionCategory.LANGUAGE]: '📚',
  [QuestionCategory.LOGICAL_REASONING]: '🧠',
  [QuestionCategory.MEMORY]: '🧩',
  [QuestionCategory.PERSONALITY]: '👤',
  [QuestionCategory.SPATIAL_INTELLIGENCE]: '🌐'
};

const difficultyColors = {
  [QuestionDifficulty.EASY]: 'bg-green-100 text-green-800',
  [QuestionDifficulty.MEDIUM]: 'bg-yellow-100 text-yellow-800',
  [QuestionDifficulty.HARD]: 'bg-red-100 text-red-800'
};

const TestTakingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { submitTestAnswers } = useAuth();

  const [test, setTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [animationClass, setAnimationClass] = useState('animate-fade-in');

  useEffect(() => {
    const testFromState = location.state?.test;
    
    if (!testFromState) {
      navigate('/dashboard');
      return;
    }

    setTest(testFromState);
    setTimeRemaining(testFromState.timeLimit * 60);
  }, [location.state, navigate]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    const currentQuestion = test?.questions[questionIndex];
    
    if (!currentQuestion) return;

    const newAnswer = {
      questionId: currentQuestion.id,
      selectedOption: optionIndex,
      category: currentQuestion.category,
      difficulty: currentQuestion.difficulty
    };

    const updatedAnswers = userAnswers.filter(
      answer => answer.questionId !== currentQuestion.id
    );
    setUserAnswers([...updatedAnswers, newAnswer]);

    // Animate and move to next question
    setAnimationClass('animate-slide-out');
    setTimeout(() => {
      if (questionIndex < (test?.questions.length || 0) - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setAnimationClass('animate-fade-in');
      }
    }, 300);
  };

  const handleSubmitTest = async () => {
    if (!isTestComplete()) {
      alert('Por favor, responde todas las preguntas');
      return;
    }

    try {
      const result = await submitTestAnswers(test.id, userAnswers);
      
      navigate('/test-results', { 
        state: { 
          testResult: result, 
          test 
        } 
      });
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('No se pudo enviar el test');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const isTestComplete = () => {
    return userAnswers.length === test?.questions.length;
  };

  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-4 text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">{test.title}</h1>
        <p className="text-gray-600 mb-4 text-center">{test.description}</p>

        <div className="space-y-6">
          {test.questions.map((question, questionIndex) => (
            <div 
              key={`question-${questionIndex}`} 
              className="bg-gray-50 p-4 rounded-lg"
            >
              <h3 className="text-lg font-semibold mb-4">
                {questionIndex + 1}. {question.text}
              </h3>
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <button
                    key={`option-${questionIndex}-${optionIndex}`}
                    onClick={() => handleAnswerSelect(questionIndex, optionIndex)}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                      userAnswers.some(a => 
                        a.questionId === question.id && 
                        a.selectedOption === optionIndex
                      ) 
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {/* Manejar tanto objetos como strings */}
                    {typeof option === 'object' ? option.text : option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div className="text-gray-600">
            Tiempo restante: {formatTime(timeRemaining)}
          </div>
          <button
            onClick={handleSubmitTest}
            disabled={!isTestComplete()}
            className={`px-6 py-2 rounded-lg transition-colors ${
              isTestComplete()
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Enviar Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestTakingPage;

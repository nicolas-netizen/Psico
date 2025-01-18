import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeft 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

// Enum for question categories
enum QuestionCategory {
  MATHEMATICAL = 'MATHEMATICAL',
  VERBAL = 'VERBAL',
  LOGICAL = 'LOGICAL'
}

// Icons for different categories
const categoryIcons = {
  [QuestionCategory.MATHEMATICAL]: '🔢',
  [QuestionCategory.VERBAL]: '📝',
  [QuestionCategory.LOGICAL]: '🧩'
};

// Interface for a single question
interface Question {
  id: string;
  text: string;
  category: QuestionCategory;
  options: string[];
  correctOption?: number;
}

// Interface for user's answer
interface UserAnswer {
  questionId: string;
  selectedOption: number;
  category: QuestionCategory;
}

const TestTakingPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getTestById, submitTestAnswers } = useAuth();

  // State variables
  const [test, setTest] = useState<{ 
    id: string; 
    title: string; 
    questions: Question[] 
  } | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);

  // Fetch test details on component mount
  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        if (!testId) {
          toast.error('No se encontró el ID del test');
          navigate('/dashboard');
          return;
        }

        const fetchedTest = await getTestById(testId);
        setTest(fetchedTest);
      } catch (error) {
        console.error('Error fetching test:', error);
        toast.error('No se pudo cargar el test');
        navigate('/dashboard');
      }
    };

    fetchTestDetails();
  }, [testId, navigate, getTestById]);

  // Handle option selection
  const handleOptionSelect = (optionIndex: number) => {
    if (!test) return;

    const currentQuestion = test.questions[currentQuestionIndex];
    
    // Update or add user answer
    setUserAnswers(prevAnswers => {
      // Remove existing answer for this question if it exists
      const filteredAnswers = prevAnswers.filter(
        answer => answer.questionId !== currentQuestion.id
      );

      // Add new answer
      return [
        ...filteredAnswers, 
        {
          questionId: currentQuestion.id,
          selectedOption: optionIndex,
          category: currentQuestion.category
        }
      ];
    });
  };

  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    if (!test) return false;
    const currentQuestion = test.questions[currentQuestionIndex];
    return userAnswers.some(
      answer => answer.questionId === currentQuestion.id
    );
  };

  // Navigation between questions
  const goToNextQuestion = () => {
    if (!test) return;
    
    // Ensure current question is answered
    if (!isCurrentQuestionAnswered()) {
      toast.error('Por favor, selecciona una respuesta antes de continuar');
      return;
    }

    // Move to next question or submit test
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmitTest();
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Submit test
  const handleSubmitTest = async () => {
    try {
      // Validate that all questions are answered
      const unansweredQuestions = test?.questions.filter(
        q => !userAnswers.some(a => a.questionId === q.id)
      );

      if (unansweredQuestions && unansweredQuestions.length > 0) {
        toast.error(`Por favor, responda todas las preguntas. Faltan ${unansweredQuestions.length} preguntas por responder.`);
        return;
      }

      // Submit answers
      const result = await submitTestAnswers(test!.id, userAnswers);
      
      // Navigate to results page
      navigate(`/test-results/${result.id}`, { 
        state: { 
          testResult: result, 
          test 
        } 
      });
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Hubo un error al enviar el test. Por favor, intente nuevamente.');
    }
  };

  // Render loading state
  if (!test) {
    return <div className="text-center text-xl mt-10">Cargando test...</div>;
  }

  // Current question
  const currentQuestion = test.questions[currentQuestionIndex];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{test.title}</h1>
          <div className="text-sm text-gray-600">
            Pregunta {currentQuestionIndex + 1} de {test.questions.length}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center mb-4">
            <span className="mr-2 text-2xl">
              {categoryIcons[currentQuestion.category]}
            </span>
            <h2 className="text-xl font-semibold">
              {currentQuestion.text}
            </h2>
          </div>

          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                className={`
                  w-full text-left p-4 rounded-lg transition-colors duration-200
                  ${userAnswers.some(
                    answer => 
                      answer.questionId === currentQuestion.id && 
                      answer.selectedOption === index
                  ) 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-blue-100'
                  }
                `}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between mt-8">
          {currentQuestionIndex > 0 && (
            <button 
              onClick={goToPreviousQuestion}
              className="flex items-center bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              <ArrowLeft className="mr-2" /> Anterior
            </button>
          )}

          <button 
            onClick={goToNextQuestion}
            className={`
              flex items-center 
              ${currentQuestionIndex === test.questions.length - 1 
                ? 'bg-green-500 text-white' 
                : 'bg-blue-500 text-white'
              } 
              px-4 py-2 rounded-lg hover:opacity-90 ml-auto
            `}
          >
            {currentQuestionIndex === test.questions.length - 1 
              ? 'Enviar Test' 
              : 'Siguiente'
            } 
            <ArrowRight className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestTakingPage;

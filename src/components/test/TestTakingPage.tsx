import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

interface Question {
  id: string;
  text: string;
  blockType: string;
  options: string[];
  correctOption?: number;
}

interface Test {
  id: string;
  title: string;
  questions: Question[];
}

interface UserAnswer {
  questionId: string;
  selectedOption: number;
  blockType: string;
}

const TestTakingPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { currentUser, getTestById, submitTestResult } = useAuth();
  const [test, setTest] = useState<Test | null>(null);
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
        if (fetchedTest && 'questions' in fetchedTest) {
          const testData = {
            id: fetchedTest.id,
            title: fetchedTest.title,
            questions: (fetchedTest.questions as any[]).map(q => ({
              id: q.id,
              text: q.text,
              blockType: q.blockType,
              options: q.options || [],
              correctOption: q.correctOption
            }))
          };
          setTest(testData);
        }
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
    
    setUserAnswers(prevAnswers => {
      const filteredAnswers = prevAnswers.filter(
        answer => answer.questionId !== currentQuestion.id
      );

      return [
        ...filteredAnswers, 
        {
          questionId: currentQuestion.id,
          selectedOption: optionIndex,
          blockType: currentQuestion.blockType
        }
      ];
    });
  };

  // Submit test
  const handleSubmitTest = async () => {
    if (!test || !currentUser) return;

    try {
      const unansweredQuestions = test.questions.filter(
        q => !userAnswers.some(a => a.questionId === q.id)
      );

      if (unansweredQuestions.length > 0) {
        toast.error(`Por favor, responda todas las preguntas. Faltan ${unansweredQuestions.length} preguntas por responder.`);
        return;
      }

      // Calcular resultados
      const results = {
        testId: test.id,
        userId: currentUser.uid,
        score: 0,
        answers: userAnswers.map(answer => {
          const question = test.questions.find(q => q.id === answer.questionId);
          const isCorrect = question?.correctOption === answer.selectedOption;
          return {
            questionId: answer.questionId,
            isCorrect,
            blockName: answer.blockType
          };
        }),
        blocks: [] as { type: string; correct: number; total: number; }[]
      };

      // Calcular estadísticas por bloque
      const blockStats = userAnswers.reduce((acc, answer) => {
        const block = answer.blockType;
        if (!acc[block]) {
          acc[block] = { correct: 0, total: 0 };
        }
        const question = test.questions.find(q => q.id === answer.questionId);
        if (question?.correctOption === answer.selectedOption) {
          acc[block].correct++;
        }
        acc[block].total++;
        return acc;
      }, {} as Record<string, { correct: number; total: number; }>);

      results.blocks = Object.entries(blockStats).map(([type, stats]) => ({
        type,
        correct: stats.correct,
        total: stats.total
      }));

      // Calcular puntuación total
      const totalCorrect = results.answers.filter(a => a.isCorrect).length;
      results.score = Math.round((totalCorrect / test.questions.length) * 100);
      
      // Guardar resultados en Firestore
      const resultId = await submitTestResult(test.id, results);
      
      // Navigate to results page
      navigate(`/test-results/${resultId}`, { 
        state: { 
          testResult: {
            id: resultId,
            ...results
          },
          test: {
            id: test.id,
            title: test.title,
            questions: test.questions
          }
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
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              className="flex items-center bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              <ArrowLeft className="mr-2" /> Anterior
            </button>
          )}

          <button 
            onClick={handleSubmitTest}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:opacity-90 ml-auto"
          >
            Enviar Test
            <ArrowRight className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestTakingPage;

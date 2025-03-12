import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: string;
  options?: string[];
  correctAnswer?: number;
}

interface Test {
  id: string;
  title: string;
  questions: Question[];
  isTemporary?: boolean;
  userId: string;
  timeLimit?: number;
}

const SolveTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [test, setTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime] = useState(new Date());

  useEffect(() => {
    loadTest();
  }, [testId]);

  useEffect(() => {
    if (test?.timeLimit) {
      setTimeLeft(test.timeLimit);
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [test]);

  const loadTest = async () => {
    if (!testId || !currentUser) return;

    try {
      const testRef = doc(db, 'temporaryTests', testId);
      const testDoc = await getDoc(testRef);
      
      if (testDoc.exists() && testDoc.data().userId === currentUser.uid) {
        setTest({
          id: testDoc.id,
          ...testDoc.data()
        } as Test);
      } else {
        toast.error('Test no encontrado o no tienes permiso para acceder');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error loading test:', error);
      toast.error('Error al cargar el test');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelection = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (test && currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    if (!test) return 0;
    
    let correctAnswers = 0;
    test.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    return (correctAnswers / test.questions.length) * 100;
  };

  const handleSubmit = async () => {
    if (!test || !currentUser) return;

    setSubmitting(true);
    try {
      const score = calculateScore();
      const endTime = new Date();
      const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      // Guardar el resultado
      await addDoc(collection(db, 'testResults'), {
        userId: currentUser.uid,
        testId: test.id,
        score,
        completedAt: new Date(),
        testType: 'custom',
        blocksUsed: location.state?.selectedBlocks || '',
        questionsAnswered: test.questions.length,
        timeSpent,
        answers: selectedAnswers
      });

      toast.success('Test completado exitosamente');
      navigate(`/test-review/${test.id}`);
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Error al enviar el test');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Test no encontrado</p>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const isSpecialTest = testId === 'xtNw7Hg0hcTfjBF6nKsr';

  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-gray-50 ${isSpecialTest ? 'top-16' : ''}`}>
      <div className={`bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl mx-6 flex flex-col ${
        isSpecialTest ? 'max-h-[calc(100vh-5rem)]' : 'max-h-[calc(100vh-2rem)]'
      }`}>
        {/* Timer Section */}
        <div className={`text-right ${timeLeft !== null ? 'mb-4' : ''}`}>
          {timeLeft !== null && (
            <>
              <div className="text-2xl font-bold text-gray-900">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-500">Tiempo restante</div>
            </>
          )}
        </div>

        {/* Question Section */}
        <div className="flex-grow flex flex-col min-h-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {currentQuestion.text}
          </h2>
          
          <div className="space-y-3 flex-grow">
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelection(index)}
                className={`w-full p-4 text-left rounded-lg transition-all duration-200 ${
                  selectedAnswers[currentQuestionIndex] === index
                    ? 'bg-[#91c26a] text-white'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Section */}
        <div className="mt-6">
          {/* Question Numbers */}
          <div className="flex justify-center gap-2 mb-4">
            {test.questions.map((_, index) => (
              <div
                key={index}
                className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium text-lg 
                  transition-all duration-200 transform hover:scale-110 cursor-pointer
                  ${index === currentQuestionIndex 
                    ? 'bg-[#91c26a] text-white shadow-md' 
                    : selectedAnswers[index] !== undefined
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'border-2 border-gray-300 text-gray-600 hover:border-[#91c26a] hover:text-[#91c26a]'
                  }`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 text-gray-600 rounded-lg hover:bg-gray-100 
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            {currentQuestionIndex === test.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || selectedAnswers.length !== test.questions.length}
                className="px-6 py-2 bg-[#91c26a] text-white rounded-lg 
                         hover:bg-[#82b35b] transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Finalizar Test</span>
                )}
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                disabled={selectedAnswers[currentQuestionIndex] === undefined}
                className="px-6 py-2 text-[#91c26a] border border-[#91c26a] rounded-lg
                         hover:bg-[#91c26a] hover:text-white transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolveTest;

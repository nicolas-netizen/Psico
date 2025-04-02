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
      toast.error('Completar todas las preguntas');
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

  return (
    <div className="fixed inset-0 top-16 bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="min-h-full w-full flex items-center justify-center p-3">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg w-full max-w-2xl border border-gray-100">
          <div className="p-5">
            {/* Timer Section */}
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-lg font-semibold text-gray-700">Evaluación Psicológica</h1>
              {timeLeft !== null && (
                <div className="inline-flex items-center bg-gradient-to-r from-[#91c26a]/20 to-[#91c26a]/10 px-3 py-1.5 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#91c26a] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="text-lg font-bold text-gray-800">
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-[#91c26a] font-medium">Tiempo restante</div>
                  </div>
                </div>
              )}
            </div>

            {/* Question Section */}
            <div>
              <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
                <h2 className="text-base font-bold text-gray-800">
                  {currentQuestion.text}
                </h2>
              </div>
              
              <div className="space-y-2.5">
                {currentQuestion.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelection(index)}
                    className={`w-full p-3 text-left rounded-xl transition-all duration-200 border-2 group
                      ${selectedAnswers[currentQuestionIndex] === index
                        ? 'bg-gradient-to-r from-[#91c26a] to-[#82b35b] text-white border-transparent shadow-md'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-[#91c26a]/50 hover:shadow-md hover:bg-[#91c26a]/5'
                      }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-base font-medium transition-all duration-200
                        ${selectedAnswers[currentQuestionIndex] === index
                          ? 'bg-white text-[#91c26a]'
                          : 'bg-gray-50 text-gray-500 group-hover:bg-white group-hover:text-[#91c26a]'
                        }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="text-sm">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Section */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              {/* Question Numbers */}
              <div className="flex justify-center flex-wrap gap-2 mb-4">
                {test.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg font-medium text-xs transition-all duration-200
                      ${index === currentQuestionIndex 
                        ? 'bg-gradient-to-r from-[#91c26a] to-[#82b35b] text-white shadow-md' 
                        : selectedAnswers[index] !== undefined
                          ? 'bg-[#91c26a]/10 text-[#91c26a] hover:bg-[#91c26a]/20'
                          : 'border-2 border-gray-200 text-gray-500 hover:border-[#91c26a]/50 hover:text-[#91c26a]'
                      }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-50 
                           disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm
                           transition-all duration-200 hover:text-[#91c26a]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </button>

                {currentQuestionIndex === test.questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || selectedAnswers.length !== test.questions.length}
                    className="px-4 py-2 bg-gradient-to-r from-[#91c26a] to-[#82b35b] text-white rounded-lg 
                             hover:from-[#82b35b] hover:to-[#91c26a] transition-all duration-300 shadow-md
                             disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center space-x-2 text-sm font-medium"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <span>Finalizar Test</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    disabled={selectedAnswers[currentQuestionIndex] === undefined}
                    className="px-4 py-2 text-[#91c26a] border-2 border-[#91c26a] rounded-lg
                             hover:bg-gradient-to-r hover:from-[#91c26a] hover:to-[#82b35b] hover:text-white 
                             transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed 
                             flex items-center text-sm font-medium"
                  >
                    <span>Siguiente</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolveTest;

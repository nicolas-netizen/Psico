import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageUtils';

interface BaseQuestion {
  id: string;
  type: 'Texto' | 'Memoria' | 'Distracción' | 'Secuencia' | 'TextoImagen';
  blockType: string;
  blockName: string;
}

interface TextQuestion extends BaseQuestion {
  type: 'Texto' | 'TextoImagen';
  text: string;
  options: string[];
  correctAnswer: number;
  imageUrl?: string;
}

interface MemoryQuestion extends BaseQuestion {
  type: 'Memoria';
  images: string[];
  correctImageIndex: number;
  memorizeTime?: number; // tiempo en segundos para memorizar
}

type Question = TextQuestion | MemoryQuestion;

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
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime] = useState(new Date());
  const [showingMemoryImages, setShowingMemoryImages] = useState(false);
  const [memoryTimer, setMemoryTimer] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const currentQuestion = test?.questions[currentQuestionIndex];

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

  useEffect(() => {
    const state = location.state as { blocks?: { type: string; count: number; timeLimit: number }[] };
    if (state?.blocks) {
      // Crear un test temporal con los bloques seleccionados
      const totalTime = state.blocks.reduce((total, block) => total + block.timeLimit, 0);
      const tempTest: Test = {
        id: 'temp-' + Math.random().toString(36).substr(2, 9),
        title: 'Test Personalizado',
        questions: [],
        isTemporary: true,
        userId: currentUser?.uid || '',
        timeLimit: totalTime
      };
      setTest(tempTest);
      setTimeLeft(totalTime * 60);
    }
  }, [location.state, currentUser]);

  const loadTest = async () => {
    if (!testId || !currentUser) return;

    try {
      // Primero intentamos buscar en tests
      const testRef = doc(db, 'tests', testId);
      let testDoc = await getDoc(testRef);
      
      // Si no está en tests, buscamos en temporaryTests
      if (!testDoc.exists()) {
        const tempTestRef = doc(db, 'temporaryTests', testId);
        testDoc = await getDoc(tempTestRef);
      }
      
      if (testDoc.exists()) {
        const testData = testDoc.data();
        console.log('Test data loaded:', testData); // Debug

        const formattedQuestions = testData.questions.map((q: any) => {
          console.log('Processing question:', q); // Debug
          if (q.type === 'Texto' || q.type === 'TextoImagen') {
            return {
              id: q.id || Math.random().toString(),
              type: q.type,
              text: q.text || q.question,
              options: q.options || [],
              correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
              imageUrl: q.imageUrl || null,
              blockType: q.blockType,
              blockName: q.blockName
            } as TextQuestion;
          } else if (q.type === 'Memoria') {
            return {
              id: q.id || Math.random().toString(),
              type: q.type,
              images: q.images || [],
              correctImageIndex: q.correctImageIndex || 0,
              memorizeTime: q.memorizeTime || 10,
              blockType: q.blockType,
              blockName: q.blockName
            } as MemoryQuestion;
          } else {
            throw new Error(`Tipo de pregunta desconocido: ${q.type}`);
          }
        });

        console.log('Formatted questions:', formattedQuestions); // Debug

        setTest({
          id: testDoc.id,
          title: testData.title || testData.name || 'Test sin título',
          questions: formattedQuestions,
          userId: testData.userId || currentUser.uid,
          timeLimit: testData.timeLimit || null,
          isTemporary: testData.isTemporary || false
        });
      } else {
        toast.error('Test no encontrado');
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
      if (test.questions[currentQuestionIndex + 1].type === 'Memoria') {
        const memorizeTime = (test.questions[currentQuestionIndex + 1] as MemoryQuestion).memorizeTime || 10;
        setShowingMemoryImages(true);
        setMemoryTimer(memorizeTime);
      }
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
      if (question.type === 'Memoria') {
        if (selectedAnswers[index] === question.correctImageIndex) {
          correctAnswers++;
        }
      } else {
        if (selectedAnswers[index] === question.correctAnswer) {
          correctAnswers++;
        }
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

      // Preparar las respuestas con información de bloques
      const answers = test.questions.map((question, index) => ({
        blockName: question.blockName,
        isCorrect: selectedAnswers[index] === (
          question.type === 'Memoria' 
            ? (question as MemoryQuestion).correctImageIndex 
            : (question as TextQuestion).correctAnswer
        ),
        questionId: question.id
      }));
      
      // Guardar el resultado
      await addDoc(collection(db, 'testResults'), {
        userId: currentUser.uid,
        testId: test.id,
        score,
        completedAt: new Date(),
        timeSpent,
        answers,
        questionsAnswered: test.questions.length
      });

      navigate('/dashboard');
      toast.success('Test completado con éxito');
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Error al enviar el test');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    if (currentQuestion.type === 'Memoria') {
      const memoryQuestion = currentQuestion as MemoryQuestion;
      const memorizeTime = memoryQuestion.memorizeTime || 10; // 10 segundos por defecto

      if (showingMemoryImages) {
        return (
          <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-gray-800">
                Memoriza las siguientes imágenes
              </h2>
              <div className="text-lg font-bold text-[#91c26a]">
                {memoryTimer}s
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {memoryQuestion.images.map((imageUrl, index) => (
                <div key={index} className="flex justify-center">
                  <img 
                    src={getOptimizedImageUrl(imageUrl, {
                      width: 400,
                      quality: 80
                    })} 
                    alt={`Imagen ${index + 1}`}
                    className="max-w-full h-auto rounded-lg shadow-md"
                    style={{ maxHeight: '200px' }}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/150x150?text=Error+al+cargar+imagen';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }

      return (
        <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-4">
            Selecciona la imagen que viste anteriormente
          </h2>
        </div>
      );
    }

    const textQuestion = currentQuestion as TextQuestion;
    return (
      <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-4">
          {textQuestion.text}
        </h2>
        {textQuestion.imageUrl && (
          <div className="flex justify-center mb-4">
            <img 
              src={getOptimizedImageUrl(textQuestion.imageUrl, {
                width: 800,
                quality: 80
              })} 
              alt="Imagen de la pregunta"
              className="max-w-full h-auto rounded-lg shadow-md"
              style={{ maxHeight: '300px' }}
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/150x150?text=Error+al+cargar+imagen';
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderOptions = () => {
    if (!currentQuestion) return null;

    if (currentQuestion.type === 'Memoria') {
      if (showingMemoryImages) {
        return null; // No mostrar opciones durante la memorización
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(currentQuestion as MemoryQuestion).images.map((imageUrl, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelection(index)}
              className={`p-3 rounded-xl transition-all duration-200 border-2 flex justify-center
                ${selectedAnswers[currentQuestionIndex] === index
                  ? 'bg-gradient-to-r from-[#91c26a] to-[#82b35b] border-transparent shadow-md'
                  : 'bg-white border-gray-200 hover:border-[#91c26a]/50 hover:shadow-md hover:bg-[#91c26a]/5'
                }`}
            >
              <img 
                src={getOptimizedImageUrl(imageUrl, {
                  width: 200,
                  quality: 80
                })} 
                alt={`Opción ${index + 1}`}
                className="max-w-full h-auto rounded-lg"
                style={{ maxHeight: '150px' }}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2.5">
        {(currentQuestion as TextQuestion).options?.map((option, index) => (
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
              <span className="flex-1">{option}</span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  // Efecto para manejar el temporizador de memorización
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (currentQuestion?.type === 'Memoria') {
      const memorizeTime = (currentQuestion as MemoryQuestion).memorizeTime || 10;
      setShowingMemoryImages(true);
      setMemoryTimer(memorizeTime);

      timer = setInterval(() => {
        setMemoryTimer((prev) => {
          if (prev === null || prev <= 1) {
            if (timer) clearInterval(timer);
            setShowingMemoryImages(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setShowingMemoryImages(false);
      setMemoryTimer(null);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentQuestion]);

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
              {renderQuestion()}
              {renderOptions()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <button
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`px-4 py-2 rounded-lg transition-colors
                  ${currentQuestionIndex === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
              >
                Anterior
              </button>

              {currentQuestionIndex === test.questions.length - 1 && !showingMemoryImages ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-[#91c26a] to-[#82b35b] text-white rounded-lg hover:from-[#82b35b] hover:to-[#73a44c] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Enviando...' : 'Finalizar Test'}
                </button>
              ) : !showingMemoryImages && (
                <button
                  onClick={nextQuestion}
                  className="px-4 py-2 bg-gradient-to-r from-[#91c26a] to-[#82b35b] text-white rounded-lg hover:from-[#82b35b] hover:to-[#73a44c] transition-colors"
                >
                  Siguiente
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolveTest;

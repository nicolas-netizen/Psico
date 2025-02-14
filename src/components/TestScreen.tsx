import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { toast } from 'react-hot-toast';
import { Timer } from 'lucide-react';

interface Question {
  type: string;
  images?: string[];
  correctImageIndex?: number;
  distractionQuestion?: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
}

interface TestBlock {
  type: string;
  quantity: number;
  questions: Question[];
}

interface Test {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  blocks: TestBlock[];
  isPublic: boolean;
}

const TestScreen: React.FC = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showingImages, setShowingImages] = useState(true);
  const [showingDistraction, setShowingDistraction] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [answers, setAnswers] = useState<any[]>([]);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        if (!testId) {
          // Si no hay testId, obtener un test público aleatorio
          const testsRef = collection(db, 'tests');
          const q = query(testsRef, where('isPublic', '==', true));
          const querySnapshot = await getDocs(q);
          const publicTests = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Test[];

          if (publicTests.length > 0) {
            const randomTest = publicTests[Math.floor(Math.random() * publicTests.length)];
            setTest(randomTest);
            setTimeLeft(randomTest.timeLimit * 60);
          } else {
            toast.error('No hay tests públicos disponibles');
            navigate('/dashboard');
          }
        } else {
          const testDoc = await getDoc(doc(db, 'tests', testId));
          if (testDoc.exists()) {
            const testData = { id: testDoc.id, ...testDoc.data() } as Test;
            setTest(testData);
            setTimeLeft(testData.timeLimit * 60);
          } else {
            toast.error('Test no encontrado');
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error('Error fetching test:', error);
        toast.error('Error al cargar el test');
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId, navigate]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTestComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCurrentQuestion = () => {
    if (!test) return null;
    return test.blocks[currentBlockIndex]?.questions[currentQuestionIndex];
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    if (!showingImages && !showingDistraction) {
      const isCorrect = answerIndex === currentQuestion.correctImageIndex;
      
      // Mostrar feedback
      if (isCorrect) {
        toast.success('¡Correcto!');
      } else {
        toast.error('Incorrecto. La respuesta correcta era la imagen ' + (currentQuestion.correctImageIndex! + 1));
      }

      // Guardar la respuesta
      setAnswers(prev => [...prev, {
        blockIndex: currentBlockIndex,
        questionIndex: currentQuestionIndex,
        selectedAnswer: answerIndex,
        correct: isCorrect
      }]);

      // Esperar un momento y avanzar a la siguiente pregunta
      setTimeout(() => {
        if (currentQuestionIndex < test!.blocks[currentBlockIndex].questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else if (currentBlockIndex < test!.blocks.length - 1) {
          setCurrentBlockIndex(prev => prev + 1);
          setCurrentQuestionIndex(0);
        } else {
          handleTestComplete();
          return;
        }

        // Resetear estados para la siguiente pregunta
        setShowingImages(true);
        setShowingDistraction(false);
        setSelectedAnswer(null);
      }, 1500);
    }
  };

  const handleTestComplete = () => {
    console.log('Test completado:', answers);
    navigate('/dashboard', { state: { testCompleted: true, answers } });
  };

  const handleImagePhaseComplete = () => {
    setShowingImages(false);
    setShowingDistraction(true);
    setTimeout(() => {
      setShowingDistraction(false);
    }, 5000); // Mostrar pregunta de distracción por 5 segundos
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Test no encontrado</h2>
        <p className="mt-2 text-gray-600">El test que buscas no está disponible.</p>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  if (!currentQuestion) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header con tiempo y progreso */}
      <div className="mb-8 flex justify-between items-center">
        <div className="text-lg font-medium text-gray-900">
          Bloque {currentBlockIndex + 1} de {test.blocks.length}
        </div>
        <div className="flex items-center space-x-2 text-lg font-medium text-gray-900">
          <Timer className="h-5 w-5" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        {showingImages ? (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Memoriza las siguientes imágenes
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {currentQuestion.images?.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 left-2 bg-white rounded-full px-2 py-1 text-sm font-medium">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleImagePhaseComplete}
              className="w-full py-3 px-4 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b] transition-colors"
            >
              Continuar
            </button>
          </>
        ) : showingDistraction ? (
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {currentQuestion.distractionQuestion?.question}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.distractionQuestion?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(index)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    selectedAnswer === index
                      ? 'border-[#91c26a] bg-[#f0f7eb]'
                      : 'border-gray-200 hover:border-[#91c26a]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Selecciona la imagen que viste antes
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.images?.map((url, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`relative p-0 border-2 rounded-lg overflow-hidden transition-all ${
                    selectedAnswer === index
                      ? 'border-[#91c26a] ring-2 ring-[#91c26a]'
                      : 'border-gray-200 hover:border-[#91c26a]'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-white rounded-full px-2 py-1 text-sm font-medium">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestScreen;

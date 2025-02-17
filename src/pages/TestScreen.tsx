import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { toast } from 'react-hot-toast';
import { Timer, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

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
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        if (!testId) {
          // Si no hay testId, obtener un test público aleatorio
          const testsRef = collection(db, 'tests');
          const q = query(testsRef, where('isPublic', '==', true));
          const querySnapshot = await getDocs(q);
          
          console.log('Fetching public tests...');
          const publicTests = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Test[];
          
          console.log('Public tests found:', publicTests.length);

          if (publicTests.length > 0) {
            const randomTest = publicTests[Math.floor(Math.random() * publicTests.length)];
            console.log('Selected test:', randomTest);
            setTest(randomTest);
            setTimeLeft(randomTest.timeLimit * 60);
          } else {
            console.log('No public tests available');
            toast.error('No hay tests públicos disponibles');
            navigate('/dashboard');
          }
        } else {
          console.log('Fetching specific test:', testId);
          const testDoc = await getDoc(doc(db, 'tests', testId));
          if (testDoc.exists()) {
            const testData = { id: testDoc.id, ...testDoc.data() } as Test;
            console.log('Test found:', testData);
            setTest(testData);
            setTimeLeft(testData.timeLimit * 60);
          } else {
            console.log('Test not found');
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
    if (!currentQuestion || selectedAnswer !== null) return;

    setSelectedAnswer(answerIndex);
    const isAnswerCorrect = answerIndex === currentQuestion.correctImageIndex;
    setIsCorrect(isAnswerCorrect);
    setShowFeedback(true);

    // Guardar la respuesta
    setAnswers(prev => [...prev, {
      blockIndex: currentBlockIndex,
      questionIndex: currentQuestionIndex,
      selectedAnswer: answerIndex,
      correct: isAnswerCorrect
    }]);

    // Esperar y avanzar
    setTimeout(() => {
      setShowFeedback(false);
      if (currentQuestionIndex < test!.blocks[currentBlockIndex].questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else if (currentBlockIndex < test!.blocks.length - 1) {
        setCurrentBlockIndex(prev => prev + 1);
        setCurrentQuestionIndex(0);
      } else {
        handleTestComplete();
        return;
      }

      // Resetear estados
      setShowingImages(true);
      setShowingDistraction(false);
      setSelectedAnswer(null);
    }, 2000);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header mejorado */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">{test?.title}</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Bloque {currentBlockIndex + 1} de {test?.blocks.length}</span>
                <span>•</span>
                <span>Pregunta {currentQuestionIndex + 1} de {test?.blocks[currentBlockIndex]?.questions.length}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-4 py-2 bg-[#f0f7eb] rounded-lg">
                <Timer className="h-5 w-5 text-[#91c26a]" />
                <span className="font-medium text-[#91c26a]">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
          {/* Barra de progreso */}
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#91c26a] transition-all duration-300"
              style={{ 
                width: `${((currentBlockIndex * test?.blocks[currentBlockIndex]?.questions.length + currentQuestionIndex) / 
                (test?.blocks.reduce((acc, block) => acc + block.questions.length, 0) || 1)) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Contenido principal con animaciones */}
        <div className="bg-white shadow-lg rounded-lg p-8 transition-all duration-300">
          {showingImages ? (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-bold text-gray-900 text-center">
                Memoriza las siguientes imágenes
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {currentQuestion?.images?.map((url, index) => (
                  <div key={index} className="relative group transform hover:scale-105 transition-all duration-300">
                    <img
                      src={url}
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-56 object-cover rounded-lg shadow-md"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 
                                  text-sm font-medium shadow-sm group-hover:bg-[#91c26a] group-hover:text-white transition-all">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleImagePhaseComplete}
                className="w-full mt-6 py-4 px-6 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b] 
                         transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Continuar</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          ) : showingDistraction ? (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
                {currentQuestion?.distractionQuestion?.question}
              </h3>
              <div className="grid grid-cols-2 gap-6">
                {currentQuestion?.distractionQuestion?.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnswer(index)}
                    className={`p-6 rounded-lg border-2 transition-all duration-300 transform hover:scale-105
                              ${selectedAnswer === index
                                ? 'border-[#91c26a] bg-[#f0f7eb] shadow-md'
                                : 'border-gray-200 hover:border-[#91c26a] hover:shadow-md'
                              }`}
                  >
                    <span className="text-lg">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
                ¿Cuál de estas imágenes viste antes?
              </h3>
              <div className="grid grid-cols-2 gap-6">
                {currentQuestion?.images?.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={selectedAnswer !== null}
                    className={`relative p-0 border-2 rounded-lg overflow-hidden transition-all duration-300 
                              transform hover:scale-105 ${
                      selectedAnswer === index
                        ? 'border-[#91c26a] ring-2 ring-[#91c26a] shadow-lg'
                        : 'border-gray-200 hover:border-[#91c26a] hover:shadow-md'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-56 object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 
                                  text-sm font-medium shadow-sm">
                      {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Feedback animado */}
        {showFeedback && (
          <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                          flex items-center space-x-3 px-6 py-4 rounded-lg shadow-lg animate-fadeInScale
                          ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
            {isCorrect ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span className="text-lg font-medium text-green-900">¡Correcto!</span>
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-600" />
                <span className="text-lg font-medium text-red-900">
                  Incorrecto. La respuesta era la imagen {currentQuestion?.correctImageIndex! + 1}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestScreen;

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

import { getOptimizedImageUrl } from '../utils/imageUtils';

interface BaseQuestion {
  id: string;
  type: 'Texto' | 'Memoria' | 'Distracción' | 'Secuencia' | 'TextoImagen';
  blockType: string;
  blockName: string;
  blockTimeLimit?: number; // Tiempo límite en minutos para el bloque
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
  shuffledOrder?: string[]; // orden aleatorio de las imágenes para la selección
}

type Question = TextQuestion | MemoryQuestion;

interface Test {
  id: string;
  title: string;
  questions: Question[];
  isTemporary?: boolean;
  userId: string;
  timeLimit?: number;
  startTime?: string;
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
  const [blockTimeLeft, setBlockTimeLeft] = useState<number | null>(null);
  const [showingMemoryImages, setShowingMemoryImages] = useState(false);
  const [isTestFinished, setIsTestFinished] = useState(false);
  const [nextBlockName, setNextBlockName] = useState<string>('');
  const [testResult, setTestResult] = useState<{score: number, answers: any[], recommendations: { blockName: string, tips: string[], exercises: string[], resources: string[] }[]}>(); 
  const [showBlockIntro, setShowBlockIntro] = useState(true);
  const [currentBlock, setCurrentBlock] = useState<string>('');

  // Obtener la pregunta actual y las preguntas del bloque actual
  const currentQuestion = test?.questions[currentQuestionIndex];
  const currentBlockQuestions = test?.questions.filter(q => q.blockName === currentBlock) || [];

  useEffect(() => {
    loadTest();
  }, [testId]);

  useEffect(() => {
    if (test?.questions && test.questions.length > 0) {
      // Establecer el primer bloque
      const firstBlockName = test.questions[0].blockName;
      setCurrentBlock(firstBlockName);
      setShowBlockIntro(true);
      setCurrentQuestionIndex(0);
    }
  }, [test]);

  useEffect(() => {
    if (test?.questions && test.questions.length > 0) {
      // Solo iniciar el temporizador cuando cambia el bloque
      if (showBlockIntro) {
        const currentBlockTime = test.questions[currentQuestionIndex].blockTimeLimit || 15;
        setBlockTimeLeft(currentBlockTime * 60);
      }

      const timer = setInterval(() => {
        setBlockTimeLeft(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            // Si se acaba el tiempo del bloque, pasar al siguiente
            const nextBlockIndex = findNextBlockStartIndex(currentQuestionIndex, test.questions);
            if (nextBlockIndex !== -1) {
              setCurrentQuestionIndex(nextBlockIndex);
              setShowBlockIntro(true);
              return test.questions[nextBlockIndex].blockTimeLimit ? test.questions[nextBlockIndex].blockTimeLimit * 60 : 15 * 60;
            } else {
              handleSubmit();
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [test, showBlockIntro]);

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
        timeLimit: totalTime,
        startTime: new Date().toISOString()
      };
      setTest(tempTest);
      setBlockTimeLeft(totalTime * 60);
    }
  }, [location.state, currentUser]);

  const loadTest = async () => {
    if (!testId || !currentUser) return;
    setShowBlockIntro(true);

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

        // Establecer el bloque inicial
        if (testData.questions && testData.questions.length > 0) {
          setCurrentBlock(testData.questions[0].blockName);
        }

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
              type: 'Memoria',
              images: Array.isArray(q.images) ? q.images : [],
              correctImageIndex: typeof q.correctImageIndex === 'number' ? q.correctImageIndex : 0,
              memorizeTime: typeof q.memorizeTime === 'number' ? q.memorizeTime : 10,
              blockType: q.blockType || 'Memoria',
              blockName: q.blockName || 'Memoria'
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
      setShowBlockIntro(false);
    }
  };

  const handleAnswerSelection = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  // Función para encontrar el índice de la primera pregunta del siguiente bloque
  const findNextBlockStartIndex = (currentIndex: number, questions: Question[]): number => {
    const currentBlockName = questions[currentIndex].blockName;
    for (let i = currentIndex + 1; i < questions.length; i++) {
      if (questions[i].blockName !== currentBlockName) {
        return i;
      }
    }
    return -1; // No hay más bloques
  };

  const nextQuestion = () => {
    if (!test) return;

    const currentBlockIndex = currentBlockQuestions.findIndex(q => 
      test.questions.indexOf(q) === currentQuestionIndex
    );

    if (currentBlockIndex < currentBlockQuestions.length - 1) {
      // Siguiente pregunta en el mismo bloque
      const nextQuestionIndex = test.questions.indexOf(currentBlockQuestions[currentBlockIndex + 1]);
      setCurrentQuestionIndex(nextQuestionIndex);

      // Manejar preguntas de memoria
      const nextQuestion = currentBlockQuestions[currentBlockIndex + 1];
      if (nextQuestion.type === 'Memoria') {
        setShowingMemoryImages(true);
      }
    } else {
      // Fin del bloque actual, buscar siguiente bloque
      const blocks = [...new Set(test.questions.map(q => q.blockName))];
      const currentBlockPosition = blocks.indexOf(currentBlock);
      
      if (currentBlockPosition < blocks.length - 1) {
        // Hay más bloques
        const nextBlockName = blocks[currentBlockPosition + 1];
        const nextBlockQuestions = test.questions.filter(q => q.blockName === nextBlockName);
        
        setNextBlockName(nextBlockName);
        setTimeout(() => setNextBlockName(''), 3000);
        setShowBlockIntro(true);
        setCurrentBlock(nextBlockName);
        setCurrentQuestionIndex(test.questions.indexOf(nextBlockQuestions[0]));
        
        const newBlockTimeLimit = nextBlockQuestions[0].blockTimeLimit || 15;
        setBlockTimeLeft(newBlockTimeLimit * 60);
      } else {
        // No hay más bloques, finalizar test
        handleSubmit();
      }
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const getBlockRecommendation = (blockName: string, percentage: number, timeSpent: number) => {
    const recommendations: { [key: string]: { tips: string[], exercises: string[], resources: string[] } } = {
      'Sinónimos': {
        tips: [
          'Practica la lectura activa subrayando sinónimos',
          'Crea tarjetas de estudio con palabras y sus sinónimos',
          'Utiliza un diccionario de sinónimos regularmente'
        ],
        exercises: [
          'Ejercicios de completar oraciones con sinónimos',
          'Juegos de emparejamiento de palabras',
          'Redacción usando sinónimos específicos'
        ],
        resources: [
          'Diccionario de la RAE',
          'Wordreference - Sección de sinónimos',
          'Ejercicios de vocabulario en línea'
        ]
      },
      'Antónimos': {
        tips: [
          'Estudia palabras junto con sus opuestos',
          'Practica identificando antónimos en textos',
          'Crea listas de pares de antónimos'
        ],
        exercises: [
          'Ejercicios de opuestos en contexto',
          'Juegos de palabras contrarias',
          'Redacción usando antónimos'
        ],
        resources: [
          'Diccionario de antónimos online',
          'Aplicaciones de práctica de vocabulario',
          'Recursos educativos de lenguaje'
        ]
      },
      'Memoria': {
        tips: [
          'Practica técnicas de memorización visual',
          'Utiliza asociaciones mentales',
          'Realiza ejercicios de memoria regularmente'
        ],
        exercises: [
          'Juegos de memoria con cartas',
          'Ejercicios de secuencias',
          'Práctica de patrones visuales'
        ],
        resources: [
          'Aplicaciones de entrenamiento cerebral',
          'Juegos de memoria online',
          'Recursos de desarrollo cognitivo'
        ]
      }
    };

    // Obtener recomendaciones base del bloque o usar recomendaciones genéricas
    const baseRecommendation = recommendations[blockName] || {
      tips: [
        'Revisa el material de estudio relacionado',
        'Practica con ejercicios similares',
        'Toma notas durante el aprendizaje'
      ],
      exercises: [
        'Realiza ejercicios prácticos',
        'Participa en actividades de grupo',
        'Crea tus propios ejercicios'
      ],
      resources: [
        'Materiales de estudio online',
        'Videos educativos',
        'Recursos de práctica'
      ]
    };

    // Personalizar recomendaciones según el rendimiento
    let finalTips = [...baseRecommendation.tips];
    let finalExercises = [...baseRecommendation.exercises];
    let finalResources = [...baseRecommendation.resources];

    if (percentage < 50) {
      finalTips.unshift('Dedica más tiempo a estudiar los conceptos básicos');
      finalExercises.unshift('Comienza con ejercicios más simples');
    } else if (percentage < 70) {
      finalTips.unshift('Enfocáte en las áreas donde tuviste dificultades');
    } else if (percentage >= 90) {
      finalTips.unshift('¡Excelente trabajo! Considera ayudar a otros estudiantes');
      finalExercises.unshift('Intenta ejercicios más desafiantes');
    }

    // Ajustar recomendaciones según el tiempo empleado
    if (timeSpent > 300) { // más de 5 minutos
      finalTips.push('Intenta mejorar tu velocidad de respuesta');
    }

    return {
      tips: finalTips,
      exercises: finalExercises,
      resources: finalResources
    };
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
      const currentTime = new Date();
      const startTimeDate = test?.startTime ? new Date(test.startTime) : new Date();
      const timeSpent = Math.floor((currentTime.getTime() - startTimeDate.getTime()) / 1000);

      // Preparar las respuestas con información de bloques
      const answers = test.questions.map((question, index) => {
        const isMemoryQuestion = question.type === 'Memoria';
        const isTextQuestion = question.type === 'Texto' || question.type === 'TextoImagen';
        
        const baseAnswer = {
          blockName: question.blockName || 'Sin bloque',
          questionId: question.id,
          questionType: question.type,
          selectedAnswer: selectedAnswers[index] ?? -1
        };

        if (isMemoryQuestion) {
          const memoryQ = question as MemoryQuestion;
          return {
            ...baseAnswer,
            isCorrect: selectedAnswers[index] === memoryQ.correctImageIndex,
            question: 'Pregunta de memoria',
            correctAnswer: memoryQ.correctImageIndex
          };
        } else if (isTextQuestion) {
          const textQ = question as TextQuestion;
          return {
            ...baseAnswer,
            isCorrect: selectedAnswers[index] === textQ.correctAnswer,
            question: textQ.text || '',
            correctAnswer: textQ.correctAnswer
          };
        }

        // Para otros tipos de preguntas
        return {
          ...baseAnswer,
          isCorrect: false,
          question: 'Pregunta sin tipo definido',
          correctAnswer: -1
        };
      });
      
      // Guardar el resultado
      const testResult = {
        userId: currentUser.uid,
        testId: test.id,
        score: Math.round(score * 100) / 100,
        completedAt: new Date(),
        timeSpent,
        answers,
        questionsAnswered: test.questions.length
      };

      await addDoc(collection(db, 'testResults'), testResult);

      // Agrupar respuestas por bloque y calcular porcentajes
      const blockResults = answers.reduce((acc: { [key: string]: { correct: number, total: number } }, answer) => {
        const blockName = answer.blockName || 'Sin bloque';
        if (!acc[blockName]) {
          acc[blockName] = { correct: 0, total: 0 };
        }
        acc[blockName].total++;
        if (answer.isCorrect) acc[blockName].correct++;
        return acc;
      }, {});

      // Generar recomendaciones por bloque
      const recommendations = Object.entries(blockResults).map(([blockName, results]) => {
        const percentage = (results.correct / results.total) * 100;
        const blockRecommendation = getBlockRecommendation(blockName, percentage, timeSpent);
        return {
          blockName,
          percentage: Math.round(percentage * 100) / 100,
          ...blockRecommendation
        };
      });

      setTestResult({ score, answers, recommendations });
      setIsTestFinished(true);
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
      const shuffledImages = [...memoryQuestion.images];

      if (showingMemoryImages) {
        // Durante la fase de memorización, solo mostrar la imagen correcta
        const correctImage = memoryQuestion.images[memoryQuestion.correctImageIndex];
        return (
          <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-gray-800">
                Memoriza la siguiente imagen
              </h2>
            </div>
            <div className="flex justify-center mb-4">
              <img 
                src={correctImage} 
                alt="Imagen a memorizar"
                className="max-w-full h-auto rounded-lg shadow-md"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/150x150?text=Error+al+cargar+imagen';
                }}
              />
            </div>
          </div>
        );
      }

      // En la fase de selección, mostrar todas las opciones
      // Asegurarse de que las imágenes estén en un orden aleatorio pero consistente
      if (!memoryQuestion.shuffledOrder) {
        for (let i = shuffledImages.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledImages[i], shuffledImages[j]] = [shuffledImages[j], shuffledImages[i]];
        }
        memoryQuestion.shuffledOrder = shuffledImages;
      }
      const displayImages = memoryQuestion.shuffledOrder || shuffledImages;

      return (
        <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-4">
            Selecciona la imagen que viste anteriormente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayImages.map((imageUrl: string, index: number) => (
              <div key={index} className="flex justify-center">
                <button
                  onClick={() => handleAnswerSelection(index)}
                  className={`border-2 rounded-lg p-2 transition-all duration-200 ${
                    selectedAnswers[currentQuestionIndex] === index
                      ? 'border-[#91c26a] shadow-lg scale-105'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`Opción ${index + 1}`}
                    className="max-w-full h-auto rounded-lg"
                    style={{ maxHeight: '300px', objectFit: 'contain' }}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/150x150?text=Error+al+cargar+imagen';
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
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
                quality: 80,
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
    if (!test || !currentQuestion || currentQuestion.type !== 'Texto') return null;

    const textQuestion = currentQuestion as TextQuestion;
    return (
      <div className="space-y-3">
        {textQuestion.options.map((option: string, index: number) => (
          <button
            key={index}
            onClick={() => handleAnswerSelection(index)}
            className={`w-full p-3 text-left rounded-xl transition-all duration-200 border-2 group ${
              selectedAnswers[currentQuestionIndex] === index
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

  return (
    <div className="fixed inset-0 top-16 bg-gray-50 overflow-y-auto">
      <div className="min-h-full w-full flex justify-center py-6 px-3">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl border border-gray-200 my-auto">
          <div className="p-6 md:p-8">
            {isTestFinished && testResult ? (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Resultados del Test</h2>
                  <div className="bg-[#91c26a]/10 px-8 py-6 rounded-xl border border-[#91c26a]/20 mb-4">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-[#91c26a] mb-2">
                        {testResult.score.toFixed(1)}%
                      </div>
                      <div className="text-sm text-[#91c26a] font-medium uppercase tracking-wide">
                        Puntuación
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Recomendaciones por Bloque</h3>
                  {testResult.recommendations.map((rec: { blockName: string; tips: string[]; exercises: string[]; resources: string[] }, index: number) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 p-6 rounded-lg space-y-5">
                      <h4 className="text-lg font-semibold text-gray-700">{rec.blockName}</h4>
                      {rec.tips.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Consejos:</h5>
                          <ul className="list-disc list-inside text-gray-600 space-y-1">
                            {rec.tips.map((tip: string, i: number) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {rec.exercises.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Ejercicios Recomendados:</h5>
                          <ul className="list-disc list-inside text-gray-600 space-y-1">
                            {rec.exercises.map((exercise: string, i: number) => (
                              <li key={i}>{exercise}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {rec.resources.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Recursos:</h5>
                          <ul className="list-disc list-inside text-gray-600 space-y-1">
                            {rec.resources.map((resource: string, i: number) => (
                              <li key={i}>{resource}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => {
                      setIsTestFinished(false);
                      setCurrentQuestionIndex(0);
                      setSelectedAnswers([]);
                      navigate('/dashboard');
                    }}
                    className="px-6 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b] transition-colors"
                  >
                    Volver al Dashboard
                  </button>
                </div>
              </div>
            ) : showBlockIntro ? (
              <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden p-8">
                {/* Ícono del bloque */}
                <div className="mb-8 flex justify-center">
                  <div className="w-32 h-32 rounded-full bg-[#91c26a]/10 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-16 h-16 text-[#91c26a]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                </div>

                {/* Título y descripción */}
                <div className="text-center space-y-4">
                  <h2 className="text-[28px] font-bold text-[#1a1a1a]">
                    Bloque: {currentBlock}
                  </h2>
                  
                  <div className="inline-flex items-center justify-center bg-[#91c26a]/10 px-4 py-2 rounded-full gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#91c26a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[#91c26a] font-medium">
                      Tiempo límite: {blockTimeLeft && Math.floor(blockTimeLeft / 60)} minutos
                    </span>
                  </div>

                  <p className="text-gray-600 max-w-md mx-auto text-center">
                    Este bloque evaluará tu capacidad de comprensión y
                    análisis verbal. Asegúrate de leer cuidadosamente cada
                    pregunta.
                  </p>

                  <button
                    onClick={() => setShowBlockIntro(false)}
                    className="mt-4 px-8 py-3 bg-[#91c26a] text-white font-medium rounded-lg
                      hover:bg-[#82b35b] transition-colors duration-200"
                  >
                    Comenzar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Header with Timer */}
                <div className="mb-6">
                  <div className="flex items-center justify-end mb-2">
                    <div className="inline-flex items-center gap-2 bg-[#91c26a]/10 px-3 py-1.5 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#91c26a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-[#91c26a] font-medium">
                        {blockTimeLeft && Math.floor(blockTimeLeft / 60)}:{blockTimeLeft && (blockTimeLeft % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">{currentBlock}</h3>
                </div>

                {renderQuestion()}
                {renderOptions()}

                {/* Question Navigation */}
                <div className="mt-8 flex flex-wrap gap-2">
                  {currentBlockQuestions.map((question, blockIndex) => {
                    if (!test) return null;
                    const index = test.questions.indexOf(question);
                    const isCurrentQuestion = index === currentQuestionIndex;
                    const hasAnswer = selectedAnswers[index] !== undefined;

                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center border-2 ${isCurrentQuestion ? 'bg-[#91c26a] text-white border-[#91c26a]' : hasAnswer ? 'bg-[#91c26a]/10 text-[#91c26a] border-[#91c26a]/30' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#91c26a]/50 hover:bg-[#91c26a]/5'}`}
                      >
                        {blockIndex + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={previousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className={currentQuestionIndex === 0 ? 'px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-400 cursor-not-allowed' : 'px-4 py-2 rounded-lg transition-colors bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}
                  >
                    Anterior
                  </button>

                  {test && currentQuestionIndex === test.questions.length - 1 && !showingMemoryImages ? (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-4 py-2 bg-gradient-to-r from-[#91c26a] to-[#82b35b] text-white rounded-lg hover:from-[#82b35b] hover:to-[#73a44c] transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Enviando...' : 'Finalizar Test'}
                    </button>
                  ) : !showingMemoryImages ? (
                    <button
                      onClick={nextQuestion}
                      className="px-6 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b] transition-colors"
                    >
                      Siguiente
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notificación del siguiente bloque */}
      {nextBlockName && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-50">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-[#91c26a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">Siguiente bloque</p>
              <p className="text-sm text-gray-600">{nextBlockName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolveTest;

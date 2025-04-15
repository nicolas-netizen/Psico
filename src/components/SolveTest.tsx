import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

import { getOptimizedImageUrl } from '../utils/imageUtils';

interface BaseQuestion {
  id: string;
  type: 'Texto' | 'Memoria' | 'Distracción' | 'Secuencia' | 'TextoImagen' | 'MemoriaDistractor';
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

interface MemoryDistractorQuestion extends BaseQuestion {
  type: 'MemoriaDistractor';
  images: string[];
  correctImageIndex: number;
  memoryTime?: number; // tiempo en segundos para memorizar la imagen (por defecto 6)
  distractor: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
  realQuestion: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
  // Estados internos para controlar el flujo
  _currentStep?: 'memorize' | 'distractor' | 'real';
  _distractorAnswered?: boolean;
}

type Question = TextQuestion | MemoryQuestion | MemoryDistractorQuestion;

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
  
  // Estados para preguntas de memoria con distractor
  const [memoryTimer, setMemoryTimer] = useState<number | null>(null);
  const [currentMemoryStep, setCurrentMemoryStep] = useState<'memorize' | 'distractor' | 'real' | null>(null);
  const [distractorAnswered, setDistractorAnswered] = useState(false);

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

  // Function to navigate to the previous question
  const previousQuestion = () => {
    if (!test || currentQuestionIndex === 0) return;
    
    // Handle any special memory steps if needed
    if (showingMemoryImages) {
      // If showing memory images, don't move to previous question
      // Just keep current state and return
      return;
    }
    
    // Handle any special steps for memory distractor questions
    if (currentQuestion?.type === 'MemoriaDistractor' && currentMemoryStep) {
      if (currentMemoryStep === 'real') {
        // Go back to distractor step
        setCurrentMemoryStep('distractor');
        return;
      } else if (currentMemoryStep === 'distractor') {
        // Can't go back to memorize step, just continue with normal navigation
        setCurrentMemoryStep(null);
        setDistractorAnswered(false);
        setMemoryTimer(null);
      }
    }

    // If we're at the first question of a block, go to the previous block's last question
    const isFirstQuestionInBlock = currentBlockQuestions.indexOf(currentQuestion as Question) === 0;
    
    if (isFirstQuestionInBlock && currentQuestionIndex > 0) {
      // Find the previous block name
      const prevBlockName = test.questions[currentQuestionIndex - 1].blockName;
      
      // If it's a different block
      if (prevBlockName !== currentBlock) {
        // Move to the last question of the previous block
        setCurrentBlock(prevBlockName);
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        return;
      }
    }
    
    // Standard case - move to the previous question
    setCurrentQuestionIndex(currentQuestionIndex - 1);
  };
  
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
          } else if (q.type === 'MemoriaDistractor') {
            return {
              id: q.id || Math.random().toString(),
              type: 'MemoriaDistractor',
              images: Array.isArray(q.images) ? q.images : [],
              correctImageIndex: typeof q.correctImageIndex === 'number' ? q.correctImageIndex : 0,
              memoryTime: typeof q.memoryTime === 'number' ? q.memoryTime : 6,
              distractor: q.distractor || {
                question: q.distractor?.question || '',
                options: q.distractor?.options || ['', '', '', ''],
                correctAnswer: q.distractor?.correctAnswer || 0
              },
              realQuestion: q.realQuestion || {
                question: q.realQuestion?.question || '',
                options: q.realQuestion?.options || ['', '', '', ''],
                correctAnswer: q.realQuestion?.correctAnswer || 0
              },
              blockType: q.blockType || 'Memoria',
              blockName: q.blockName || 'Memoria',
              _currentStep: 'memorize',
              _distractorAnswered: false
            } as MemoryDistractorQuestion;
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
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newSelectedAnswers);
    
    // Si estamos en una pregunta de memoria con distractor y en el paso de distracción
    if (currentQuestion?.type === 'MemoriaDistractor' && currentMemoryStep === 'distractor') {
      setDistractorAnswered(true);
    }
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

    // Manejo de preguntas de memoria con distractor
    if (currentQuestion?.type === 'MemoriaDistractor') {
      const memoryQuestion = currentQuestion as MemoryDistractorQuestion;
      
      // Si estamos en el paso de memorización y no hemos mostrado la imagen aún
      if (currentMemoryStep === 'memorize' || currentMemoryStep === null) {
        setCurrentMemoryStep('memorize');
        setShowingMemoryImages(true);
        
        // Mostrar imagen por el tiempo especificado (o 6 segundos por defecto)
        const memorizeTime = memoryQuestion.memoryTime || 6;
        setMemoryTimer(memorizeTime);
        
        const timer = setInterval(() => {
          setMemoryTimer(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(timer);
              setShowingMemoryImages(false);
              setCurrentMemoryStep('distractor');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return;
      }
      
      // Si estamos en el paso de distracción
      if (currentMemoryStep === 'distractor') {
        // Solo permitir avanzar si se ha respondido a la pregunta de distracción
        if (!distractorAnswered) {
          toast.warning('Debes responder a la pregunta de distracción para continuar');
          return;
        }
        
        // Pasar al paso de la pregunta real
        setCurrentMemoryStep('real');
        return;
      }
      
      // Si estamos en el paso de la pregunta real, pasar a la siguiente pregunta
      if (currentMemoryStep === 'real') {
        // Resetear el estado para la próxima pregunta de memoria
        setCurrentMemoryStep(null);
        setDistractorAnswered(false);
        setMemoryTimer(null);
      }
    }
    
    // Manejo de preguntas de memoria estándar
    else if (currentQuestion?.type === 'Memoria' && !showingMemoryImages) {
      setShowingMemoryImages(true);
      
      // Mostrar imágenes por el tiempo especificado (o 5 segundos por defecto)
      const memorizeTime = (currentQuestion as MemoryQuestion).memorizeTime || 5;
      setTimeout(() => {
        setShowingMemoryImages(false);
      }, memorizeTime * 1000);
      
      return;
    }

    // Si estamos en la última pregunta del bloque actual
    const isLastQuestionInBlock = currentBlockQuestions.indexOf(currentQuestion as Question) === currentBlockQuestions.length - 1;
    
    if (isLastQuestionInBlock) {
      // Buscar el índice de la primera pregunta del siguiente bloque
      const nextBlockIndex = findNextBlockStartIndex(currentQuestionIndex, test.questions);
      
      if (nextBlockIndex !== -1) {
        // Hay un siguiente bloque
        const nextBlockName = test.questions[nextBlockIndex].blockName;
        setNextBlockName(nextBlockName);
        setCurrentBlock(nextBlockName);
        setCurrentQuestionIndex(nextBlockIndex);
        setShowBlockIntro(true);
      } else {
        // No hay más bloques, finalizar el test
        handleSubmit();
      }
    } else {
      // Pasar a la siguiente pregunta dentro del mismo bloque
      setCurrentQuestionIndex(currentQuestionIndex + 1);
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
    if (!test) return { score: 0, answers: [] };

    let correctCount = 0;
    let totalQuestions = 0;
    const answers = [];

    for (let i = 0; i < test.questions.length; i++) {
      const question = test.questions[i];
      const selectedAnswer = selectedAnswers[i];
      let isCorrect = false;
      let shouldCount = true; // Determina si la pregunta cuenta para el puntaje

      if (question.type === 'Texto' || question.type === 'TextoImagen') {
        isCorrect = selectedAnswer === (question as TextQuestion).correctAnswer;
      } else if (question.type === 'MemoriaDistractor') {
        // Para preguntas de memoria con distractor, solo evaluamos la respuesta real
        // La pregunta de distracción no cuenta para el puntaje
        const memoryQuestion = question as MemoryDistractorQuestion;
        
        // Verificamos si la respuesta seleccionada coincide con la respuesta correcta de la pregunta real
        // Nota: Asumimos que el índice de la respuesta seleccionada corresponde a la pregunta real
        isCorrect = selectedAnswer === memoryQuestion.realQuestion.correctAnswer;
        
        // La pregunta de distracción no cuenta para el puntaje total
        shouldCount = true;
      }

      if (isCorrect && shouldCount) correctCount++;
      if (shouldCount) totalQuestions++;

      answers.push({
        questionId: question.id,
        selectedAnswer,
        isCorrect,
        shouldCount
      });
    }

    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    return { score, answers };
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
        } else if (question.type === 'MemoriaDistractor') {
          const memoryDistractorQ = question as MemoryDistractorQuestion;
          return {
            ...baseAnswer,
            isCorrect: selectedAnswers[index] === memoryDistractorQ.realQuestion.correctAnswer,
            question: memoryDistractorQ.realQuestion.question,
            correctAnswer: memoryDistractorQ.realQuestion.correctAnswer
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
        score: Math.round(score.score * 100) / 100,
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

      setTestResult({ score: score.score, answers: score.answers, recommendations });
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

    if (currentQuestion.type === 'Texto' || currentQuestion.type === 'TextoImagen') {
      return (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-800 mb-4">{(currentQuestion as TextQuestion).text}</h4>
          {(currentQuestion as TextQuestion).imageUrl && (
            <div className="mb-4">
              <img 
                src={getOptimizedImageUrl((currentQuestion as TextQuestion).imageUrl || '')} 
                alt="Imagen de la pregunta" 
                className="max-w-full rounded-lg mx-auto"
                style={{ maxHeight: '300px' }}
              />
            </div>
          )}
        </div>
      );
    }

    if (currentQuestion.type === 'Memoria') {
      const memoryQuestion = currentQuestion as MemoryQuestion;
      
      if (showingMemoryImages) {
        return (
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-800 mb-4">Memoriza las siguientes imágenes</h4>
            <div className="grid grid-cols-2 gap-4">
              {memoryQuestion.images.map((image, index) => (
                <div key={index} className="border rounded-lg p-2">
                  <img 
                    src={getOptimizedImageUrl(image)} 
                    alt={`Imagen ${index + 1}`} 
                    className="w-full h-48 object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      } else {
        return (
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-800 mb-4">Selecciona la imagen correcta</h4>
          </div>
        );
      }
    }
    
    if (currentQuestion.type === 'MemoriaDistractor') {
      const memoryQuestion = currentQuestion as MemoryDistractorQuestion;
      
      // Paso 1: Mostrar la imagen para memorizar
      if (currentMemoryStep === 'memorize') {
        return (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-800">Memoriza la siguiente imagen</h4>
              <div className="text-xl font-bold text-[#91c26a]">{memoryTimer}s</div>
            </div>
            <div className="flex justify-center">
              {memoryQuestion.images.length > 0 && (
                <div className="border rounded-lg p-2">
                  <img 
                    src={getOptimizedImageUrl(memoryQuestion.images[0])} 
                    alt="Imagen para memorizar" 
                    className="max-h-80 object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        );
      }
      
      // Paso 2: Mostrar la pregunta de distracción
      if (currentMemoryStep === 'distractor') {
        return (
          <div className="mb-6">
            <div className="p-3 bg-yellow-50 rounded-lg mb-4 border border-yellow-200">
              <p className="text-sm text-yellow-700">Esta pregunta es solo de distracción y no afecta tu puntaje.</p>
            </div>
            <h4 className="text-lg font-medium text-gray-800 mb-4">{memoryQuestion.distractor.question}</h4>
          </div>
        );
      }
      
      // Paso 3: Mostrar la pregunta real relacionada con la imagen
      if (currentMemoryStep === 'real') {
        return (
          <div className="mb-6">
            <div className="p-3 bg-green-50 rounded-lg mb-4 border border-green-200">
              <p className="text-sm text-green-700">Ahora, responde esta pregunta sobre la imagen que memorizaste.</p>
            </div>
            <h4 className="text-lg font-medium text-gray-800 mb-4">{memoryQuestion.realQuestion.question}</h4>
          </div>
        );
      }
    }

    return null;
  };

  const renderOptions = () => {
    if (!currentQuestion) return null;

    if (currentQuestion.type === 'Texto' || currentQuestion.type === 'TextoImagen') {
      return (
        <div className="space-y-3">
          {(currentQuestion as TextQuestion).options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelection(index)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${selectedAnswers[currentQuestionIndex] === index ? 'bg-[#91c26a]/20 border-2 border-[#91c26a]' : 'bg-white border border-gray-200 hover:border-[#91c26a]/50 hover:bg-[#91c26a]/5'}`}
            >
              <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
            </button>
          ))}
        </div>
      );
    }
    
    if (currentQuestion.type === 'MemoriaDistractor') {
      const memoryQuestion = currentQuestion as MemoryDistractorQuestion;
      
      // No mostrar opciones durante la memorización
      if (currentMemoryStep === 'memorize') {
        return null;
      }
      
      // Mostrar opciones para la pregunta de distracción
      if (currentMemoryStep === 'distractor') {
        return (
          <div className="space-y-3">
            {memoryQuestion.distractor.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelection(index)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedAnswers[currentQuestionIndex] === index ? 'bg-[#91c26a]/20 border-2 border-[#91c26a]' : 'bg-white border border-gray-200 hover:border-[#91c26a]/50 hover:bg-[#91c26a]/5'}`}
              >
                <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
              </button>
            ))}
          </div>
        );
      }
      
      // Mostrar opciones para la pregunta real
      if (currentMemoryStep === 'real') {
        return (
          <div className="space-y-3">
            {memoryQuestion.realQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelection(index)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedAnswers[currentQuestionIndex] === index ? 'bg-[#91c26a]/20 border-2 border-[#91c26a]' : 'bg-white border border-gray-200 hover:border-[#91c26a]/50 hover:bg-[#91c26a]/5'}`}
              >
                <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
              </button>
            ))}
          </div>
        );
      }
    }

    return null;
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

                  {test && currentQuestionIndex === test.questions.length - 1 && !showingMemoryImages && currentMemoryStep !== 'memorize' && currentMemoryStep !== 'distractor' ? (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-4 py-2 bg-gradient-to-r from-[#91c26a] to-[#82b35b] text-white rounded-lg hover:from-[#82b35b] hover:to-[#73a44c] transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Enviando...' : 'Finalizar Test'}
                    </button>
                  ) : !showingMemoryImages && currentMemoryStep !== 'memorize' ? (
                    <button
                      onClick={nextQuestion}
                      className="px-6 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b] transition-colors"
                    >
                      {currentMemoryStep === 'distractor' && !distractorAnswered ? 'Responde para continuar' : 'Siguiente'}
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

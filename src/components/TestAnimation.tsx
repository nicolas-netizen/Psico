import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Brain, BookOpen, Calculator, Puzzle } from 'lucide-react';

interface Block {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  questions: Question[];
}

interface Question {
  type: 'sequence' | 'spatial' | 'logical' | 'verbal';
  text: string;
  sequence?: (number | string)[];
  image?: string;
  options: (number | string)[];
  correct: number;
}

const TestAnimation = () => {
  const [currentBlock, setCurrentBlock] = useState(0);
  const [showingIntro, setShowingIntro] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timer, setTimer] = useState(30);

  const blocks: Block[] = [
    {
      id: 'verbal',
      title: 'Aptitud Verbal',
      description: 'Evalúa tu comprensión del lenguaje y vocabulario',
      icon: <BookOpen className="w-16 h-16 text-[#91c26a]" />,
      questions: [
        {
          type: 'verbal',
          text: 'Selecciona el sinónimo de "Efímero":',
          options: ['Duradero', 'Pasajero', 'Eterno', 'Constante'],
          correct: 1,
        },
        {
          type: 'verbal',
          text: 'Complete la analogía: Libro es a Página como Árbol es a...',
          options: ['Raíz', 'Hoja', 'Tronco', 'Rama'],
          correct: 1,
        }
      ]
    },
    {
      id: 'numerical',
      title: 'Razonamiento Numérico',
      description: 'Pon a prueba tu capacidad de análisis matemático',
      icon: <Calculator className="w-16 h-16 text-[#91c26a]" />,
      questions: [
        {
          type: 'sequence',
          text: '¿Qué número continúa la serie?',
          sequence: [2, 4, 8, 16, '?'],
          options: [24, 32, 28, 30],
          correct: 1,
        },
        {
          type: 'sequence',
          text: 'Completa la secuencia:',
          sequence: [1, 3, 6, 10, '?'],
          options: [15, 16, 14, 13],
          correct: 0,
        }
      ]
    },
    {
      id: 'spatial',
      title: 'Razonamiento Espacial',
      description: 'Evalúa tu capacidad de visualización y orientación espacial',
      icon: <Puzzle className="w-16 h-16 text-[#91c26a]" />,
      questions: [
        {
          type: 'spatial',
          text: 'Si giras esta figura 90° a la derecha, ¿qué forma verás?',
          image: '▲',
          options: ['◄', '▼', '►', '▲'],
          correct: 2,
        },
        {
          type: 'spatial',
          text: '¿Qué figura completa el patrón?',
          image: '■',
          options: ['●', '▲', '■', '◆'],
          correct: 2,
        }
      ]
    },
    {
      id: 'logical',
      title: 'Razonamiento Lógico',
      description: 'Demuestra tu capacidad de pensamiento abstracto',
      icon: <Brain className="w-16 h-16 text-[#91c26a]" />,
      questions: [
        {
          type: 'logical',
          text: 'Si A > B y B > C, entonces...',
          options: [
            'C puede ser mayor que A',
            'A es definitivamente mayor que C',
            'No hay suficiente información',
            'B es mayor que A'
          ],
          correct: 1,
        },
        {
          type: 'logical',
          text: 'Si todos los X son Y, y algunos Y son Z, entonces...',
          options: [
            'Todos los X son Z',
            'Algunos X pueden ser Z',
            'Ningún X es Z',
            'Todos los Z son X'
          ],
          correct: 1,
        }
      ]
    }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (!showingIntro) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev === 0) {
            handleNextQuestion();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentBlock, currentQuestion, showingIntro]);

  const handleNextQuestion = () => {
    const currentBlockQuestions = blocks[currentBlock].questions;
    
    if (currentQuestion < currentBlockQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setTimer(30);
    } else if (currentBlock < blocks.length - 1) {
      setCurrentBlock(prev => prev + 1);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowingIntro(true);
      setTimer(30);
    }
  };

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
    setTimeout(handleNextQuestion, 1000);
  };

  const handleStartBlock = () => {
    setShowingIntro(false);
  };

  const currentB = blocks[currentBlock];
  const currentQ = currentB.questions[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {showingIntro ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            {currentB.icon}
            <h2 className="text-3xl font-bold text-gray-900 mt-6">
              {currentB.title}
            </h2>
            <p className="mt-4 text-lg text-gray-600 mb-8">
              {currentB.description}
            </p>
            <button
              onClick={handleStartBlock}
              className="px-8 py-3 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b] transition-colors duration-300"
            >
              Comenzar
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="question"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            {/* Barra de progreso */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
              <motion.div
                className="h-full bg-[#91c26a]"
                initial={{ width: '100%' }}
                animate={{ width: `${(timer / 30) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>

            {/* Timer */}
            <div className="flex items-center justify-end mb-6 text-gray-600">
              <Clock className="w-5 h-5 mr-2" />
              <span className="font-mono">{timer}s</span>
            </div>

            {/* Pregunta */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {currentQ.text}
              </h3>

              {currentQ.type === 'sequence' && currentQ.sequence && (
                <div className="flex items-center justify-center space-x-4 text-2xl font-bold text-gray-700 mb-6">
                  {currentQ.sequence.map((num, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      {num}
                    </motion.span>
                  ))}
                </div>
              )}

              {currentQ.type === 'spatial' && currentQ.image && (
                <div className="flex justify-center mb-6">
                  <motion.div
                    className="text-6xl"
                    animate={{ rotate: 90 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    {currentQ.image}
                  </motion.div>
                </div>
              )}

              {/* Opciones */}
              <div className="grid grid-cols-2 gap-4">
                {currentQ.options.map((option, index) => (
                  <motion.button
                    key={index}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleAnswerSelect(index)}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      selectedAnswer === index
                        ? selectedAnswer === currentQ.correct
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-[#91c26a] hover:bg-[#f0f7eb]'
                    }`}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de bloques y preguntas */}
      <div className="flex flex-col items-center space-y-2 mt-6">
        {/* Indicador de bloques */}
        <div className="flex space-x-2">
          {blocks.map((block, index) => (
            <motion.div
              key={block.id}
              className={`w-3 h-3 rounded-full ${
                index === currentBlock ? 'bg-[#91c26a]' : 'bg-gray-200'
              }`}
              animate={{
                scale: index === currentBlock ? 1.2 : 1
              }}
            />
          ))}
        </div>
        
        {/* Indicador de preguntas del bloque actual */}
        {!showingIntro && (
          <div className="flex space-x-1">
            {currentB.questions.map((_, index) => (
              <motion.div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentQuestion ? 'bg-[#91c26a]' : 'bg-gray-200'
                }`}
                animate={{
                  scale: index === currentQuestion ? 1.2 : 1
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAnimation;

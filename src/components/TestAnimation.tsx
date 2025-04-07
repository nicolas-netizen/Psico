import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

interface Question {
  type: 'sequence' | 'spatial' | 'logical';
  text: string;
  sequence?: (number | string)[];
  image?: string;
  options: (number | string)[];
  correct: number;
}

const TestAnimation = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timer, setTimer] = useState(30);

  const questions: Question[] = [
    {
      type: 'sequence',
      text: '¿Qué número continúa la serie?',
      sequence: [2, 4, 8, 16, '?'],
      options: [24, 32, 28, 30],
      correct: 1,
    },
    {
      type: 'spatial',
      text: 'Si giras esta figura 90° a la derecha, ¿qué forma verás?',
      image: '▲',
      options: ['◄', '▼', '►', '▲'],
      correct: 2,
    },
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
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev === 0) {
          handleNextQuestion();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestion]);

  const handleNextQuestion = () => {
    setCurrentQuestion((prev) => (prev + 1) % questions.length);
    setSelectedAnswer(null);
    setTimer(30);
  };

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
    setTimeout(handleNextQuestion, 1000);
  };

  const currentQ = questions[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 relative overflow-hidden">
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
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
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
        </motion.div>
      </AnimatePresence>

      {/* Indicador de preguntas */}
      <div className="flex justify-center space-x-2 mt-6">
        {questions.map((_, index) => (
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
    </div>
  );
};

export default TestAnimation;

import React, { useState, useEffect } from 'react';
import { Test, TestBlock } from '../types/Test';
import { ChevronLeft, ChevronRight, Timer } from 'lucide-react';

interface InteractiveTestProps {
  test: Test;
  onComplete: (answers: { [questionId: string]: number }) => void;
}

const InteractiveTest: React.FC<InteractiveTestProps> = ({ test, onComplete }) => {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(-1); // -1 significa que no ha empezado
  const [currentBlock, setCurrentBlock] = useState<TestBlock | null>(null);
  const [answers, setAnswers] = useState<{ [questionId: string]: number }>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [testStarted, setTestStarted] = useState(false);

  useEffect(() => {
    if (currentBlockIndex >= 0 && currentBlockIndex < test.blocks.length) {
      setCurrentBlock(test.blocks[currentBlockIndex]);
      setTimeLeft(test.blocks[currentBlockIndex].timeLimit * 60); // Convertir minutos a segundos
    }
  }, [currentBlockIndex, test.blocks]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (testStarted && timeLeft > 0 && currentBlock) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleBlockComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [testStarted, timeLeft]);

  const handleAnswer = (questionId: string, answer: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleStartTest = () => {
    setCurrentBlockIndex(0);
    setTestStarted(true);
  };

  const handleBlockComplete = () => {
    if (currentBlockIndex < test.blocks.length - 1) {
      setCurrentBlockIndex(prev => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!testStarted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4">{test.title}</h1>
          <p className="text-gray-600 mb-6">{test.description}</p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Timer className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Importante: Cada bloque tiene un tiempo límite. Una vez iniciado el test, no podrás pausarlo.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleStartTest}
            className="w-full bg-[#91c26a] text-white py-2 px-4 rounded-lg hover:bg-[#7ea756] transition-colors duration-200"
          >
            Comenzar Test
          </button>
        </div>
      </div>
    );
  }

  if (!currentBlock) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{currentBlock.title}</h2>
          <div className="flex items-center space-x-2 text-gray-600">
            <Timer className="h-5 w-5" />
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {currentBlock.description && (
          <p className="text-gray-600 mb-6">{currentBlock.description}</p>
        )}

        <div className="space-y-6">
          {currentBlock.questions.map((question, qIndex) => (
            <div key={question.id} className="p-4 border border-gray-200 rounded-lg">
              <p className="font-medium mb-4">{qIndex + 1}. {question.text}</p>
              <div className="space-y-2">
                {question.options.map((option, oIndex) => (
                  <label
                    key={oIndex}
                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={oIndex}
                      checked={answers[question.id] === oIndex}
                      onChange={() => handleAnswer(question.id, oIndex)}
                      className="h-4 w-4 text-[#91c26a] focus:ring-[#91c26a] border-gray-300"
                    />
                    <span className="ml-3">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between">
          {currentBlockIndex > 0 && (
            <button
              onClick={() => setCurrentBlockIndex(prev => prev - 1)}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Bloque anterior
            </button>
          )}
          <button
            onClick={handleBlockComplete}
            className="ml-auto flex items-center bg-[#91c26a] text-white py-2 px-4 rounded-lg hover:bg-[#7ea756] transition-colors duration-200"
          >
            {currentBlockIndex === test.blocks.length - 1 ? 'Finalizar test' : 'Siguiente bloque'}
            <ChevronRight className="h-5 w-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTest;

import React, { useState } from 'react';
import { Clock } from 'lucide-react';

interface Question {
  id: number;
  block: string;
  question: string;
  image?: string;
  options: string[];
}

const TestInterface = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours in seconds

  // Example question
  const questions: Question[] = [
    {
      id: 1,
      block: 'Percepción Visual',
      question: '¿Qué figura completa la secuencia?',
      image: '/images/test/question1.jpg',
      options: ['A', 'B', 'C', 'D']
    }
    // More questions will be loaded from the database
  ];

  // Format time remaining
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return \`\${hours.toString().padStart(2, '0')}:\${minutes
      .toString()
      .padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
  };

  return (
    <div className="ml-64 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Test Psicotécnico</h2>
          <p className="text-gray-600">Bloque: {questions[currentQuestion].block}</p>
        </div>
        <div className="flex items-center space-x-2 text-gray-700">
          <Clock className="w-5 h-5" />
          <span className="font-mono">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 105 }, (_, i) => (
            <button
              key={i}
              className={\`w-8 h-8 rounded-full flex items-center justify-center \${
                i === currentQuestion
                  ? 'bg-[#91c26a] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }\`}
              onClick={() => setCurrentQuestion(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question Content */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Pregunta {currentQuestion + 1}
          </h3>
          <p className="text-gray-700">{questions[currentQuestion].question}</p>
        </div>

        {questions[currentQuestion].image && (
          <div className="mb-6">
            <img
              src={questions[currentQuestion].image}
              alt="Pregunta"
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
          {questions[currentQuestion].options.map((option, index) => (
            <label
              key={index}
              className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                name="answer"
                className="w-4 h-4 text-[#91c26a] border-gray-300 focus:ring-[#91c26a]"
              />
              <span className="ml-3">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion(curr => curr - 1)}
        >
          Anterior
        </button>
        <button
          className="px-6 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b]"
          onClick={() => setCurrentQuestion(curr => curr + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default TestInterface;

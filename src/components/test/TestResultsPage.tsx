import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, AlertCircle } from 'lucide-react';
import { getTestResults, getTestById } from '../../services/api';

interface TestResult {
  id: string;
  testId: string;
  userId: string;
  answers: Array<{
    questionId: string;
    selectedOption: number;
    isCorrect: boolean;
  }>;
  score: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    percentageScore: number;
    categoryPerformance?: Record<string, {
      totalQuestions: number;
      correctAnswers: number;
      percentageScore: number;
    }>;
    strengths?: string[];
    weaknesses?: string[];
  };
  timestamp: string;
}

interface Test {
  id: string;
  title: string;
  questions: Array<{
    id: string;
    text: string;
    options: string[] | Array<{ text: string }>;
    correctOption: number;
  }>;
}

const TestResultsPage: React.FC = () => {
  const { testResultId } = useParams<{ testResultId: string }>();
  const navigate = useNavigate();
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [test, setTest] = useState<Test | null>(null);

  useEffect(() => {
    const fetchTestResult = async () => {
      try {
        const result = await getTestResults(testResultId || '');
        setTestResult(result);

        if (result.testId) {
          const fetchedTest = await getTestById(result.testId);
          setTest(fetchedTest);
        }
      } catch (error) {
        console.error('Error fetching test result:', error);
        navigate('/dashboard');
      }
    };

    fetchTestResult();
  }, [testResultId, navigate]);

  if (!testResult || !test) {
    return <div>Loading...</div>;
  }

  // Safely access score properties
  const percentageScore = testResult.score?.percentageScore || 0;
  const correctAnswers = testResult.score?.correctAnswers || 0;
  const totalQuestions = testResult.score?.totalQuestions || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">{test.title} - Resultados</h1>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold">Puntaje Total</h2>
            <p className="text-3xl font-bold text-blue-600">
              {percentageScore.toFixed(2)}%
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold">Preguntas Correctas</h2>
            <p className="text-3xl font-bold text-green-600">
              {correctAnswers} / {totalQuestions}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Detailed Test Results</h2>
          {test.questions.map((question, index) => {
            const userAnswer = testResult.answers.find(a => a.questionId === question.id);
            
            return (
              <div 
                key={question.id} 
                className={`mb-6 p-4 rounded-lg ${
                  userAnswer?.isCorrect 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">
                    {index + 1}. {question.text}
                  </h3>
                  {userAnswer?.isCorrect ? (
                    <span className="text-green-600 font-bold">Correcto</span>
                  ) : (
                    <span className="text-red-600 font-bold">Incorrecto</span>
                  )}
                </div>

                {question.options.map((option, optionIndex) => {
                  const isUserSelected = userAnswer?.selectedOption === optionIndex;
                  const isCorrectOption = question.correctOption === optionIndex;

                  return (
                    <div 
                      key={`option-${optionIndex}`}
                      className={`
                        p-3 rounded-md mb-2 
                        ${isUserSelected ? 'border-2' : 'border'}
                        ${isUserSelected && isCorrectOption 
                          ? 'bg-green-100 border-green-500' 
                          : isUserSelected && !isCorrectOption 
                          ? 'bg-red-100 border-red-500' 
                          : isCorrectOption 
                          ? 'bg-green-50 border-green-300' 
                          : 'bg-white border-gray-200'}
                      `}
                    >
                      {typeof option === 'object' ? option.text : option}
                      {isCorrectOption && (
                        <span className="ml-2 text-green-600 font-bold">
                          (Opción Correcta)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {testResult.score.categoryPerformance && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Rendimiento por Categoría</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(testResult.score.categoryPerformance).map(([category, performance]) => (
                <div 
                  key={category} 
                  className="bg-gray-50 p-4 rounded-lg"
                >
                  <h3 className="text-lg font-semibold capitalize mb-2">
                    {category.replace('_', ' ')}
                  </h3>
                  <div className="flex justify-between">
                    <span>Correctas:</span>
                    <span className="font-bold">
                      {performance.correctAnswers} / {performance.totalQuestions}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Porcentaje:</span>
                    <span className="font-bold text-blue-600">
                      {performance.percentageScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestResultsPage;

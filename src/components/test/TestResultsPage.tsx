import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, BarChart2 } from 'lucide-react';

interface TestResult {
  id: string;
  score: number;
  answers: Array<{
    questionId: string;
    isCorrect: boolean;
    blockName: string;
  }>;
  blocks: Array<{
    type: string;
    correct: number;
    total: number;
  }>;
}

interface Test {
  id: string;
  title: string;
  questions: Array<{
    id: string;
    text: string;
    blockType: string;
  }>;
}

const TestResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.testResult as TestResult;
  const test = location.state?.test as Test;

  if (!result || !test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">No se encontraron resultados</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-[#91c26a] text-white rounded hover:bg-[#6ea844]"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{test.title}</h1>
            <div className="mt-4">
              <div className="text-5xl font-bold text-[#91c26a]">{result.score}%</div>
              <p className="mt-2 text-gray-600">Puntuación Final</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{test.questions.length}</div>
              <p className="text-sm text-gray-600">Total Preguntas</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                <span className="text-2xl font-bold text-gray-900">
                  {result.answers?.filter(a => a.isCorrect).length || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Correctas</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500 mr-1" />
                <span className="text-2xl font-bold text-gray-900">
                  {result.answers?.filter(a => !a.isCorrect).length || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Incorrectas</p>
            </div>
          </div>

          {/* Block Performance */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart2 className="h-5 w-5 mr-2" />
              Rendimiento por Bloque
            </h2>
            <div className="space-y-4">
              {result.blocks?.map((block, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{block.type}</span>
                    <span>
                      {block.correct} de {block.total} (
                      {Math.round((block.correct / block.total) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#91c26a] h-2 rounded-full"
                      style={{
                        width: `${(block.correct / block.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResultsPage;

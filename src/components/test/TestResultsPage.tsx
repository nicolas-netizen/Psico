import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, BarChart2 } from 'lucide-react';

interface TestResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  categoryPerformance: {
    [key: string]: {
      correct: number;
      total: number;
    };
  };
}

const TestResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as TestResult;

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">No se encontraron resultados</p>
          <button
            onClick={() => navigate('/tests')}
            className="mt-4 px-4 py-2 bg-[#91c26a] text-white rounded hover:bg-[#6ea844]"
          >
            Volver a Tests
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
            <h1 className="text-3xl font-bold text-gray-900">Resultados del Test</h1>
            <div className="mt-4">
              <div className="text-5xl font-bold text-[#91c26a]">{result.score}%</div>
              <p className="mt-2 text-gray-600">Puntuación Final</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{result.totalQuestions}</div>
              <p className="text-sm text-gray-600">Total Preguntas</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                <span className="text-2xl font-bold text-gray-900">{result.correctAnswers}</span>
              </div>
              <p className="text-sm text-gray-600">Correctas</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500 mr-1" />
                <span className="text-2xl font-bold text-gray-900">{result.incorrectAnswers}</span>
              </div>
              <p className="text-sm text-gray-600">Incorrectas</p>
            </div>
          </div>

          {/* Category Performance */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart2 className="h-5 w-5 mr-2" />
              Rendimiento por Categoría
            </h2>
            <div className="space-y-4">
              {Object.entries(result.categoryPerformance).map(([category, performance]) => (
                <div key={category}>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{category}</span>
                    <span>
                      {performance.correct} de {performance.total} (
                      {Math.round((performance.correct / performance.total) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#91c26a] h-2 rounded-full"
                      style={{
                        width: `${(performance.correct / performance.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/tests')}
              className="px-6 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#6ea844] transition-colors"
            >
              Volver a Tests
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border border-[#91c26a] text-[#91c26a] rounded-lg hover:bg-[#f3f9ee] transition-colors"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResultsPage;

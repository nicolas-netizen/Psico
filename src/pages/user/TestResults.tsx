import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface BlockScore {
  block: string;
  correct: number;
  total: number;
}

interface TestResult {
  testId: string;
  userId: string;
  answers: Array<{
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
  }>;
  blockScores: BlockScore[];
  totalScore: number;
  startedAt: Date;
  finishedAt: Date;
}

const TestResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state?.results as TestResult;

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No hay resultados disponibles
          </h1>
          <button
            onClick={() => navigate('/portal')}
            className="bg-[#91c26a] hover:bg-[#7ea756] text-white font-semibold py-2 px-6 rounded-lg"
          >
            Volver al Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Resultados de tu Test
          </h1>
          <p className="mt-2 text-xl text-gray-600">
            Puntuación Total: {results.totalScore.toFixed(2)}%
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {results.blockScores.map((score, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold mb-4">{score.block}</h2>
              <div className="space-y-4">
                <div className="relative pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-lg font-semibold text-[#91c26a]">
                        {((score.correct / score.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-gray-600">
                      {score.correct} / {score.total} correctas
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{
                        width: `${(score.correct / score.total) * 100}%`
                      }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#91c26a]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="mb-6">
            <p className="text-gray-600">
              Test completado el:{' '}
              {new Date(results.finishedAt).toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="text-gray-600">
              Duración:{' '}
              {Math.round(
                (new Date(results.finishedAt).getTime() -
                  new Date(results.startedAt).getTime()) /
                  60000
              )}{' '}
              minutos
            </p>
          </div>

          <button
            onClick={() => navigate('/portal')}
            className="bg-[#91c26a] hover:bg-[#7ea756] text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Volver al Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestResults;

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DetailedTestResult, Test } from '../../types/Test';
import { Trophy, Star, AlertCircle } from 'lucide-react';

const TestResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract test result and test from location state
  const { testResult, test } = location.state || {};

  if (!testResult || !test) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={64} />
          <h2 className="text-2xl font-bold mb-2">No Test Results Found</h2>
          <p>Please complete a test to view results.</p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render detailed test results
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <Trophy className="mx-auto mb-4 text-yellow-500" size={64} />
          <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
          <p className="text-xl text-gray-600">{test.title}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Overall Performance</h2>
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Score:</span>
              <span className="text-2xl font-bold text-blue-600">
                {testResult.score.toFixed(2)} / {test.questions.length}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-lg font-medium">Percentage:</span>
              <span className="text-2xl font-bold text-green-600">
                {testResult.percentageScore.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Insights</h2>
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Correct Answers:</span>
              <span className="text-xl font-bold text-green-600">
                {testResult.correctAnswers} / {test.questions.length}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-lg font-medium">Time Taken:</span>
              <span className="text-xl font-bold text-purple-600">
                {test.timeLimit} minutes
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Category Performance</h2>
          <div className="space-y-4">
            {Object.entries(testResult.categoryPerformance || {}).map(([category, performance]) => (
              <div 
                key={category} 
                className="bg-gray-100 p-4 rounded-lg flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-medium capitalize">{category.replace('_', ' ')}</h3>
                  <div className="text-sm text-gray-600">
                    {performance.correctAnswers} / {performance.totalQuestions} correct
                  </div>
                </div>
                <div className="text-xl font-bold">
                  {performance.percentageScore.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Strengths & Areas of Improvement</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-green-100 p-6 rounded-lg">
              <Star className="text-green-600 mb-4" size={32} />
              <h3 className="text-xl font-semibold mb-2">Strengths</h3>
              <ul className="list-disc list-inside">
                {testResult.strengths?.map(category => (
                  <li key={category} className="capitalize">
                    {category.replace('_', ' ')}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-100 p-6 rounded-lg">
              <AlertCircle className="text-red-600 mb-4" size={32} />
              <h3 className="text-xl font-semibold mb-2">Improvement Areas</h3>
              <ul className="list-disc list-inside">
                {testResult.weaknesses?.map(category => (
                  <li key={category} className="capitalize">
                    {category.replace('_', ' ')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestResultsPage;

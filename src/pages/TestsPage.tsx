import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Test, TestResult, UserAnswer } from '../types/Test';
import { InteractiveTest } from '../components/InteractiveTest';
import { useGlobalAuth } from '../hooks/useGlobalAuth';

export const TestsPage: React.FC = () => {
  const { user } = useGlobalAuth();
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const tests = await api.getAvailableTests();
        setAvailableTests(tests);

        const history = await api.getUserTestHistory();
        setTestHistory(history);
      } catch (err) {
        setError('No se pudieron cargar los tests');
        console.error(err);
      }
    };

    fetchTestData();
  }, [user]);

  const handleTestSelection = async (testId: string) => {
    try {
      console.log('Iniciando test con ID:', testId);
      const test = await api.getTestById(testId);
      if (!test) {
        throw new Error('No se pudo cargar el test');
      }
      console.log('Test cargado:', test);
      setSelectedTest(test);
      setError(null);
    } catch (err) {
      console.error('Error al cargar el test:', err);
      setError('No se pudo cargar el test seleccionado');
    }
  };

  const handleSubmitTest = async (answers) => {
    if (selectedTest) {
      try {
        const result = await api.submitTestAnswers(selectedTest.id, answers);
        alert(`Test completado. Puntuación: ${result.score}/${result.totalQuestions}`);
        setSelectedTest(null);
      } catch (err) {
        setError('Error al enviar el test');
        console.error(err);
      }
    }
  };

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="tests-page">
      <h1>Tests Disponibles</h1>

      {!selectedTest ? (
        <div className="test-selector">
          {availableTests.map(test => (
            <div key={test.id} className="test-card">
              <h3>{test.name}</h3>
              <p>Categoría: {test.subject}</p>
              <p>Dificultad: {test.difficulty}</p>
              <button 
                className="comenzar-test-btn"
                onClick={(e) => {
                  e.preventDefault();
                  handleTestSelection(test.id);
                }}
              >
                Comenzar Test
              </button>
            </div>
          ))}
        </div>
      ) : (
        <InteractiveTest 
          test={selectedTest} 
          onSubmit={handleSubmitTest} 
        />
      )}

      <div className="test-history">
        <h2>Historial de Tests</h2>
        {testHistory.map(result => (
          <div key={result.testId} className="test-result">
            <p>Test: {result.testId}</p>
            <p>Puntuación: {result.score}/{result.totalQuestions}</p>
            <p>Fecha: {new Date(result.completedAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

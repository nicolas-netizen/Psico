import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Test } from '../../types/Test';

const TestsManager: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const fetchedTests = await api.getTests();
        setTests(fetchedTests);
      } catch (err) {
        console.error('Error fetching tests:', err);
        setError('No se pudieron cargar los tests');
      }
    };

    fetchTests();
  }, []);

  const handleDeleteTest = async (testId: string) => {
    try {
      await api.deleteTest(testId);
      setTests(tests.filter(test => test.id !== testId));
      console.log('Test eliminado');
    } catch (err) {
      console.error('Error eliminando el test:', err);
      setError('No se pudo eliminar el test');
    }
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <h2>Tests Disponibles</h2>
      <ul>
        {tests.map(test => (
          <li key={test.id}>
            {test.title}
            <button onClick={() => handleDeleteTest(test.id)} className="ml-2 text-red-500">
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TestsManager; 
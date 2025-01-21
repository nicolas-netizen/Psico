import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { testService, Test } from '../services/testService';

const TestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para ver los tests');
      navigate('/login');
      return;
    }
    loadTests();
  }, [currentUser, navigate]);

  const loadTests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Aquí deberías implementar la función para obtener todos los tests disponibles
      const tests = await testService.getAvailableTests();
      
      // Validar que los tests tengan la estructura correcta
      const validTests = tests.filter(test => {
        if (!test || !test.id || !test.name || !Array.isArray(test.questions)) {
          console.warn('Test inválido encontrado:', test);
          return false;
        }
        return true;
      });

      console.log('Tests válidos cargados:', validTests);
      setAvailableTests(validTests);
    } catch (error) {
      console.error('Error al cargar los tests:', error);
      setError('No se pudieron cargar los tests disponibles');
      toast.error('Error al cargar los tests');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSelection = async (testId: string) => {
    try {
      if (!testId) {
        throw new Error('ID del test no válido');
      }

      // Verificar que el test existe y es válido
      const selectedTest = availableTests.find(test => test.id === testId);
      if (!selectedTest) {
        throw new Error('Test no encontrado');
      }

      if (!selectedTest.questions || selectedTest.questions.length === 0) {
        throw new Error('El test no tiene preguntas válidas');
      }

      // Validar la estructura de cada pregunta
      selectedTest.questions.forEach((question, index) => {
        if (!question.id || !question.text || !Array.isArray(question.options) || !question.correctAnswer) {
          throw new Error(`La pregunta ${index + 1} no tiene una estructura válida`);
        }
      });

      console.log('Iniciando test:', selectedTest);
      navigate(`/test/${testId}`);
    } catch (error) {
      console.error('Error al seleccionar el test:', error);
      toast.error(error instanceof Error ? error.message : 'Error al seleccionar el test');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadTests}
            className="text-[#91c26a] hover:text-[#7ea756] font-medium"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Tests Disponibles</h2>
      
      {availableTests.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No hay tests disponibles en este momento.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {availableTests.map((test) => (
            <div
              key={test.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {test.name}
              </h3>
              <p className="text-gray-600 mb-4">{test.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {test.questions.length} preguntas
                </span>
                <button
                  onClick={() => handleTestSelection(test.id)}
                  className="bg-[#91c26a] text-white px-4 py-2 rounded-lg 
                           hover:bg-[#7ea756] transition-colors duration-200"
                >
                  Comenzar Test
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestsPage;

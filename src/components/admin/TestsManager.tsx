import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { Test } from '../../types/Test';
import TestForm from './TestForm';

const TestsManager: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingTest, setIsCreatingTest] = useState(false);

  const fetchTests = async () => {
    try {
      const fetchedTests = await api.getTests();
      setTests(fetchedTests.sort((a: Test, b: Test) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      toast.error('No se pudieron cargar los tests');
      console.error('Error fetching tests:', error);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleCreateTest = () => {
    setSelectedTest(null);
    setIsCreatingTest(true);
    setIsModalOpen(true);
  };

  const handleEditTest = (test: Test) => {
    setSelectedTest(test);
    setIsCreatingTest(false);
    setIsModalOpen(true);
  };

  const handleDeleteTest = async (testId: string) => {
    if (!window.confirm('¿Está seguro de eliminar este test?')) return;

    try {
      // TODO: Implement delete test API method
      await api.deleteTest(testId);
      toast.success('Test eliminado exitosamente');
      fetchTests();
    } catch (error) {
      toast.error('No se pudo eliminar el test');
      console.error('Error deleting test:', error);
    }
  };

  const handleTestCreated = (newTest: Test) => {
    setTests(prev => [newTest, ...prev]);
    setIsModalOpen(false);
    toast.success('Test creado exitosamente');
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Gestión de Tests</h2>
        <button 
          onClick={handleCreateTest}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Crear Nuevo Test
        </button>
      </div>

      {/* Test List */}
      <div className="grid gap-4">
        {tests.map(test => (
          <div 
            key={test.id} 
            className="bg-white shadow-md rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <h3 className="text-lg font-semibold">{test.title}</h3>
              <p className="text-gray-600">{test.description}</p>
              <div className="text-sm text-gray-500 mt-2">
                Planes asociados: {test.plans.join(', ')}
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => handleEditTest(test)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded"
              >
                Editar
              </button>
              <button 
                onClick={() => handleDeleteTest(test.id)}
                className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Test Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {isCreatingTest ? 'Crear Nuevo Test' : 'Editar Test'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
            <TestForm 
              initialTest={selectedTest}
              onTestCreated={handleTestCreated}
              onClose={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TestsManager;

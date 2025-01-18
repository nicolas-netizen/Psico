import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { Test } from '../../types/Test';
import TestForm from './TestForm';

const TestsManager: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingTest, setIsCreatingTest] = useState(false);

  const fetchTests = async () => {
    try {
      const testsCollection = collection(db, 'tests');
      const testsSnapshot = await getDocs(testsCollection);
      const testsList = testsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Test[];
      
      setTests(testsList.sort((a: Test, b: Test) => 
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
      const testRef = doc(db, 'tests', testId);
      await deleteDoc(testRef);
      toast.success('Test eliminado exitosamente');
      fetchTests();
    } catch (error) {
      toast.error('No se pudo eliminar el test');
      console.error('Error deleting test:', error);
    }
  };

  const handleTestSaved = (savedTest: Test) => {
    setTests(prev => {
      const index = prev.findIndex(t => t.id === savedTest.id);
      if (index >= 0) {
        // Actualizar test existente
        const newTests = [...prev];
        newTests[index] = savedTest;
        return newTests;
      } else {
        // Agregar nuevo test
        return [savedTest, ...prev];
      }
    });
    setIsModalOpen(false);
    toast.success(isCreatingTest ? 'Test creado exitosamente' : 'Test actualizado exitosamente');
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Gestión de Tests</h2>
        <button 
          onClick={handleCreateTest}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Crear Nuevo Test
        </button>
      </div>

      {/* Test List */}
      <div className="grid gap-4">
        {tests.map(test => (
          <div 
            key={test.id} 
            className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
                <p className="mt-1 text-gray-600">{test.description}</p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="font-medium mr-2">Categoría:</span>
                    {test.category}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="font-medium mr-2">Tiempo:</span>
                    {test.timeLimit} minutos
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="font-medium mr-2">Preguntas:</span>
                    {test.questions?.length || 0}
                  </div>
                  {test.plans?.length > 0 && (
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium mr-2">Planes:</span>
                      {test.plans.join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <button 
                  onClick={() => handleEditTest(test)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded transition-colors"
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDeleteTest(test.id)}
                  className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}

        {tests.length === 0 && (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">No hay tests creados aún</p>
          </div>
        )}
      </div>

      {/* Test Form Modal */}
      {isModalOpen && (
        <TestForm
          test={selectedTest}
          onClose={() => setIsModalOpen(false)}
          onSave={handleTestSaved}
          isCreating={isCreatingTest}
        />
      )}
    </div>
  );
};

export default TestsManager;

import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-toastify';
import TestForm from '../../components/admin/TestForm';
import QuestionForm from '../../components/admin/QuestionForm';

interface Test {
  id: string;
  title: string;
  description: string;
  type: 'SIMULACRO' | 'PERSONALIZADO';
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const TestManagement: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTestForm, setShowTestForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const q = query(collection(db, 'tests'));
      const querySnapshot = await getDocs(q);
      const testData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Test[];
      
      setTests(testData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error al cargar los tests:', error);
      toast.error('Error al cargar los tests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (testId: string, newStatus: 'active' | 'inactive') => {
    try {
      await updateDoc(doc(db, 'tests', testId), {
        status: newStatus,
        updatedAt: new Date()
      });
      toast.success('Estado actualizado exitosamente');
      fetchTests();
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este test?')) return;

    try {
      await deleteDoc(doc(db, 'tests', testId));
      toast.success('Test eliminado exitosamente');
      fetchTests();
    } catch (error) {
      console.error('Error al eliminar el test:', error);
      toast.error('Error al eliminar el test');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Gestión de Tests</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowTestForm(true)}
            className="bg-[#91c26a] hover:bg-[#7ea756] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Crear Nuevo Test
          </button>
          <button
            onClick={() => setShowQuestionForm(true)}
            className="bg-[#6a91c2] hover:bg-[#567ea7] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Crear Nueva Pregunta
          </button>
        </div>
      </div>

      {/* Lista de Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map(test => (
          <div
            key={test.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-[1.02]"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{test.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{test.description}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      test.type === 'SIMULACRO' 
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {test.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      test.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {test.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                <p>Creado: {formatDate(test.createdAt)}</p>
                <p>Última actualización: {formatDate(test.updatedAt)}</p>
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => handleStatusChange(
                    test.id,
                    test.status === 'active' ? 'inactive' : 'active'
                  )}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    test.status === 'active'
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {test.status === 'active' ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => handleDeleteTest(test.id)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para crear/editar test */}
      {showTestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">Crear Nuevo Test</h2>
              <button
                onClick={() => setShowTestForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <TestForm
                onTestCreated={() => {
                  setShowTestForm(false);
                  fetchTests();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear pregunta */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">Crear Nueva Pregunta</h2>
              <button
                onClick={() => setShowQuestionForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <QuestionForm
                onQuestionCreated={() => {
                  setShowQuestionForm(false);
                  toast.success('Pregunta creada exitosamente');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestManagement;

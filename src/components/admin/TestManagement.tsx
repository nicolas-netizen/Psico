import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { Test, BlockConfig, QuestionBlock, TestType, TestDifficulty } from '../../types/Test';
import { toast } from 'react-toastify';

const DEFAULT_BLOCK_CONFIG: BlockConfig = {
  block: QuestionBlock.VERBAL,
  questionCount: 15,
  timeLimit: 15
};

const TestManagement: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTest, setNewTest] = useState<Partial<Test>>({
    title: '',
    description: '',
    type: 'SIMULACRO',
    difficulty: TestDifficulty.FACIL,
    blockConfigs: [{ ...DEFAULT_BLOCK_CONFIG }],
    status: 'active'
  });

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const testsSnapshot = await getDocs(collection(db, 'tests'));
      const testsData = testsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Test[];
      setTests(testsData);
    } catch (error) {
      console.error('Error loading tests:', error);
      toast.error('Error al cargar los tests');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlockConfig = () => {
    setNewTest(prev => ({
      ...prev,
      blockConfigs: [...(prev.blockConfigs || []), { ...DEFAULT_BLOCK_CONFIG }]
    }));
  };

  const handleRemoveBlockConfig = (index: number) => {
    setNewTest(prev => ({
      ...prev,
      blockConfigs: prev.blockConfigs?.filter((_, i) => i !== index)
    }));
  };

  const handleBlockConfigChange = (index: number, field: keyof BlockConfig, value: any) => {
    setNewTest(prev => {
      const newBlockConfigs = [...(prev.blockConfigs || [])];
      newBlockConfigs[index] = {
        ...newBlockConfigs[index],
        [field]: value
      };
      return { ...prev, blockConfigs: newBlockConfigs };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const testData = {
        ...newTest,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'tests'), testData);
      toast.success('Test creado exitosamente');
      
      setNewTest({
        title: '',
        description: '',
        type: 'SIMULACRO',
        difficulty: TestDifficulty.FACIL,
        blockConfigs: [{ ...DEFAULT_BLOCK_CONFIG }],
        status: 'active'
      });
      
      loadTests();
    } catch (error) {
      console.error('Error al crear el test:', error);
      toast.error('Error al crear el test');
    }
  };

  const handleUpdateTest = async (testId: string, updates: Partial<Test>) => {
    try {
      const testRef = doc(db, 'tests', testId);
      await updateDoc(testRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      toast.success('Test actualizado exitosamente');
      loadTests();
    } catch (error) {
      console.error('Error al actualizar el test:', error);
      toast.error('Error al actualizar el test');
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este test?')) {
      try {
        await deleteDoc(doc(db, 'tests', testId));
        toast.success('Test eliminado exitosamente');
        loadTests();
      } catch (error) {
        console.error('Error al eliminar el test:', error);
        toast.error('Error al eliminar el test');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Formulario para crear nuevo test */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Crear Nuevo Test</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Título</label>
            <input
              type="text"
              value={newTest.title}
              onChange={(e) => setNewTest(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              value={newTest.description}
              onChange={(e) => setNewTest(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <select
                value={newTest.type}
                onChange={(e) => setNewTest(prev => ({ ...prev, type: e.target.value as TestType }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
              >
                <option value="SIMULACRO">Simulacro</option>
                <option value="PRACTICA">Práctica</option>
                <option value="EVALUACION">Evaluación</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Dificultad</label>
              <select
                value={newTest.difficulty}
                onChange={(e) => setNewTest(prev => ({ ...prev, difficulty: e.target.value as TestDifficulty }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
              >
                {Object.values(TestDifficulty).map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">Bloques</label>
              <button
                type="button"
                onClick={handleAddBlockConfig}
                className="px-3 py-1 text-sm bg-[#91c26a] text-white rounded-md hover:bg-[#7ea756]"
              >
                Agregar Bloque
              </button>
            </div>
            
            <div className="space-y-4">
              {newTest.blockConfigs?.map((config, index) => (
                <div key={index} className="flex gap-4 items-start p-4 border rounded-lg">
                  <div className="flex-1">
                    <select
                      value={config.block}
                      onChange={(e) => handleBlockConfigChange(index, 'block', e.target.value as QuestionBlock)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                    >
                      {Object.values(QuestionBlock).map((block) => (
                        <option key={block} value={block}>
                          {block}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="number"
                      value={config.questionCount}
                      onChange={(e) => handleBlockConfigChange(index, 'questionCount', parseInt(e.target.value))}
                      placeholder="Número de preguntas"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                      min="1"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="number"
                      value={config.timeLimit}
                      onChange={(e) => handleBlockConfigChange(index, 'timeLimit', parseInt(e.target.value))}
                      placeholder="Tiempo (min)"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                      min="1"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveBlockConfig(index)}
                    className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#91c26a] text-white px-4 py-2 rounded-md hover:bg-[#7ea756]"
            >
              Crear Test
            </button>
          </div>
        </form>
      </div>

      {/* Lista de tests existentes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Tests Existentes</h2>
        </div>
        <div className="divide-y">
          {tests.map((test) => (
            <div key={test.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{test.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <span className="text-gray-500">Tipo: {test.type}</span>
                    <span className="text-gray-500">Dificultad: {test.difficulty}</span>
                    <span className="text-gray-500">Estado: {test.status}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUpdateTest(test.id!, { status: test.status === 'active' ? 'inactive' : 'active' })}
                    className={`px-3 py-1 rounded-md text-sm ${
                      test.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {test.status === 'active' ? 'Activo' : 'Inactivo'}
                  </button>
                  <button
                    onClick={() => handleDeleteTest(test.id!)}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {test.blockConfigs.map((config, index) => (
                  <div key={index} className="bg-gray-50 rounded-md p-3 text-sm">
                    <div className="font-medium">{config.block}</div>
                    <div className="text-gray-600">
                      {config.questionCount} preguntas - {config.timeLimit} min
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestManagement;

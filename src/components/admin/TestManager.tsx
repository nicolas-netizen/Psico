import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Clock, Save, Image } from 'lucide-react';

interface Test {
  id?: string;
  title: string;
  description: string;
  timeLimit: number;
  isPublic: boolean;
  blocks: {
    type: string;
    quantity: number;
    questions: {
      type: string;
      images: string[];
      correctImageIndex: number;
      distractionQuestion: {
        question: string;
        options: string[];
        correctAnswer: number;
      };
    }[];
  }[];
}

const TestManager: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [showForm, setShowForm] = useState(false);

  const emptyTest: Test = {
    title: '',
    description: '',
    timeLimit: 10,
    isPublic: true,
    blocks: [{
      type: 'memoria',
      quantity: 1,
      questions: [{
        type: 'memory',
        images: [
          'https://ejemplo.com/imagen1.jpg',
          'https://ejemplo.com/imagen2.jpg',
          'https://ejemplo.com/imagen3.jpg',
          'https://ejemplo.com/imagen4.jpg'
        ],
        correctImageIndex: 0,
        distractionQuestion: {
          question: '¿Cuánto es 2 + 2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: 1
        }
      }]
    }]
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'tests'));
      const testList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Test[];
      setTests(testList);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Error al cargar los tests');
    }
  };

  const handleCreateTest = async () => {
    try {
      await addDoc(collection(db, 'tests'), editingTest);
      toast.success('Test creado exitosamente');
      setShowForm(false);
      setEditingTest(null);
      fetchTests();
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Error al crear el test');
    }
  };

  const handleUpdateTest = async () => {
    if (!editingTest?.id) return;

    try {
      const testRef = doc(db, 'tests', editingTest.id);
      const testWithoutId = { ...editingTest };
      delete testWithoutId.id;
      await updateDoc(testRef, testWithoutId);
      toast.success('Test actualizado exitosamente');
      setShowForm(false);
      setEditingTest(null);
      fetchTests();
    } catch (error) {
      console.error('Error updating test:', error);
      toast.error('Error al actualizar el test');
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este test?')) return;

    try {
      await deleteDoc(doc(db, 'tests', testId));
      toast.success('Test eliminado exitosamente');
      fetchTests();
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Error al eliminar el test');
    }
  };

  const handleAddQuestion = () => {
    if (!editingTest) return;

    const newQuestion = {
      type: 'memory',
      images: [
        'https://ejemplo.com/imagen1.jpg',
        'https://ejemplo.com/imagen2.jpg',
        'https://ejemplo.com/imagen3.jpg',
        'https://ejemplo.com/imagen4.jpg'
      ],
      correctImageIndex: 0,
      distractionQuestion: {
        question: '¿Cuánto es 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1
      }
    };

    setEditingTest({
      ...editingTest,
      blocks: editingTest.blocks.map((block, index) => ({
        ...block,
        questions: [...block.questions, newQuestion]
      }))
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Tests</h2>
        {!showForm && (
          <button
            onClick={() => {
              setEditingTest(emptyTest);
              setShowForm(true);
            }}
            className="flex items-center px-4 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b]"
          >
            <Plus className="w-5 h-5 mr-2" />
            Crear Test
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Título</label>
              <input
                type="text"
                value={editingTest?.title || ''}
                onChange={(e) => setEditingTest(prev => prev ? { ...prev, title: e.target.value } : null)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                value={editingTest?.description || ''}
                onChange={(e) => setEditingTest(prev => prev ? { ...prev, description: e.target.value } : null)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tiempo límite (minutos)</label>
              <input
                type="number"
                value={editingTest?.timeLimit || 0}
                onChange={(e) => setEditingTest(prev => prev ? { ...prev, timeLimit: parseInt(e.target.value) } : null)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingTest?.isPublic || false}
                  onChange={(e) => setEditingTest(prev => prev ? { ...prev, isPublic: e.target.checked } : null)}
                  className="rounded border-gray-300 text-[#91c26a] focus:ring-[#91c26a]"
                />
                <span className="ml-2 text-sm text-gray-700">Test público</span>
              </label>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preguntas</h3>
              {editingTest?.blocks[0].questions.map((question, index) => (
                <div key={index} className="mb-6 p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium">Pregunta {index + 1}</h4>
                    <button
                      onClick={() => {
                        const newQuestions = [...editingTest.blocks[0].questions];
                        newQuestions.splice(index, 1);
                        setEditingTest({
                          ...editingTest,
                          blocks: [{
                            ...editingTest.blocks[0],
                            questions: newQuestions
                          }]
                        });
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">URLs de imágenes (una por línea)</label>
                      <textarea
                        value={question.images.join('\n')}
                        onChange={(e) => {
                          const newImages = e.target.value.split('\n').filter(url => url.trim());
                          const newQuestions = [...editingTest.blocks[0].questions];
                          newQuestions[index] = {
                            ...question,
                            images: newImages
                          };
                          setEditingTest({
                            ...editingTest,
                            blocks: [{
                              ...editingTest.blocks[0],
                              questions: newQuestions
                            }]
                          });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Índice de imagen correcta (0-3)</label>
                      <input
                        type="number"
                        min="0"
                        max="3"
                        value={question.correctImageIndex}
                        onChange={(e) => {
                          const newQuestions = [...editingTest.blocks[0].questions];
                          newQuestions[index] = {
                            ...question,
                            correctImageIndex: parseInt(e.target.value)
                          };
                          setEditingTest({
                            ...editingTest,
                            blocks: [{
                              ...editingTest.blocks[0],
                              questions: newQuestions
                            }]
                          });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pregunta de distracción</label>
                      <input
                        type="text"
                        value={question.distractionQuestion.question}
                        onChange={(e) => {
                          const newQuestions = [...editingTest.blocks[0].questions];
                          newQuestions[index] = {
                            ...question,
                            distractionQuestion: {
                              ...question.distractionQuestion,
                              question: e.target.value
                            }
                          };
                          setEditingTest({
                            ...editingTest,
                            blocks: [{
                              ...editingTest.blocks[0],
                              questions: newQuestions
                            }]
                          });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Opciones de distracción (una por línea)</label>
                      <textarea
                        value={question.distractionQuestion.options.join('\n')}
                        onChange={(e) => {
                          const newOptions = e.target.value.split('\n').filter(option => option.trim());
                          const newQuestions = [...editingTest.blocks[0].questions];
                          newQuestions[index] = {
                            ...question,
                            distractionQuestion: {
                              ...question.distractionQuestion,
                              options: newOptions
                            }
                          };
                          setEditingTest({
                            ...editingTest,
                            blocks: [{
                              ...editingTest.blocks[0],
                              questions: newQuestions
                            }]
                          });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Índice de respuesta correcta de distracción (0-3)</label>
                      <input
                        type="number"
                        min="0"
                        max="3"
                        value={question.distractionQuestion.correctAnswer}
                        onChange={(e) => {
                          const newQuestions = [...editingTest.blocks[0].questions];
                          newQuestions[index] = {
                            ...question,
                            distractionQuestion: {
                              ...question.distractionQuestion,
                              correctAnswer: parseInt(e.target.value)
                            }
                          };
                          setEditingTest({
                            ...editingTest,
                            blocks: [{
                              ...editingTest.blocks[0],
                              questions: newQuestions
                            }]
                          });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddQuestion}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Agregar Pregunta
              </button>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingTest(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={editingTest?.id ? handleUpdateTest : handleCreateTest}
                className="flex items-center px-4 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b]"
              >
                <Save className="w-5 h-5 mr-2" />
                {editingTest?.id ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <div key={test.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{test.title}</h3>
                  <p className="text-sm text-gray-500">{test.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingTest(test);
                      setShowForm(true);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-500"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => test.id && handleDeleteTest(test.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {test.timeLimit} min
                </div>
                <div className="flex items-center">
                  <Image className="w-4 h-4 mr-1" />
                  {test.blocks && test.blocks.length > 0 && test.blocks[0].questions 
                    ? test.blocks[0].questions.length 
                    : 0} preguntas
                </div>
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  test.isPublic ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {test.isPublic ? 'Público' : 'Privado'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestManager;

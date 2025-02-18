import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-hot-toast';
import { Block, getBlocksByType } from '../../firebase/blocks';

interface Question {
  id: string;
  type: 'Texto' | 'Memoria' | 'Distracción' | 'Secuencia';
  blockId?: string;
  blockName?: string;
  text?: string;
  options?: string[];
  correctAnswer?: number;
  images?: string[];
  correctImageIndex?: number;
  sequence?: number[];
  isPublic: boolean;
}

const QuestionManager = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<Question['type']>('Texto');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [newQuestion, setNewQuestion] = useState<Omit<Question, 'id'>>({
    type: 'Texto',
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    isPublic: true,
    blockName: ''
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (selectedType) {
      loadBlocks(selectedType);
    }
  }, [selectedType]);

  const loadBlocks = async (type: Question['type']) => {
    try {
      const loadedBlocks = await getBlocksByType(type);
      setBlocks(loadedBlocks);
      if (loadedBlocks.length > 0) {
        setSelectedBlock(loadedBlocks[0].id);
      }
    } catch (error) {
      console.error('Error loading blocks:', error);
      toast.error('Error al cargar los bloques');
    }
  };

  const loadQuestions = async () => {
    try {
      const questionsQuery = query(collection(db, 'questions'));
      const snapshot = await getDocs(questionsQuery);
      const loadedQuestions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Question[];
      setQuestions(loadedQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Error al cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    try {
      // Validar la pregunta según su tipo
      if (newQuestion.type === 'Texto' || newQuestion.type === 'Distracción') {
        if (!newQuestion.text || newQuestion.text.trim() === '') {
          toast.error('La pregunta debe tener un texto');
          return;
        }
        if (!newQuestion.options || newQuestion.options.some(opt => opt.trim() === '')) {
          toast.error('Todas las opciones deben estar completas');
          return;
        }
      } else if (newQuestion.type === 'Memoria') {
        if (!newQuestion.images || newQuestion.images.length < 2) {
          toast.error('Debe haber al menos 2 imágenes');
          return;
        }
      } else if (newQuestion.type === 'Secuencia') {
        if (!newQuestion.sequence || newQuestion.sequence.length < 3) {
          toast.error('La secuencia debe tener al menos 3 números');
          return;
        }
      }

      // Añadir el blockId a la pregunta
      const questionData = {
        ...newQuestion,
        blockId: selectedBlock,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'questions'), questionData);

      toast.success('Pregunta creada con éxito');
      loadQuestions();

      // Resetear el formulario
      setNewQuestion({
        type: selectedType,
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        isPublic: true,
        blockName: ''
      });
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('Error al crear la pregunta');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await deleteDoc(doc(db, 'questions', questionId));
      toast.success('Pregunta eliminada con éxito');
      loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Error al eliminar la pregunta');
    }
  };

  const handleTypeChange = (type: Question['type']) => {
    setSelectedType(type);
    setNewQuestion(prev => ({
      ...prev,
      type,
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      images: [],
      correctImageIndex: 0,
      sequence: [],
      blockName: ''
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Crear Nueva Pregunta</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Pregunta
            </label>
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value as Question['type'])}
              className="w-full p-2 border rounded-lg"
            >
              <option value="Texto">Texto</option>
              <option value="Memoria">Memoria</option>
              <option value="Distracción">Distracción</option>
              <option value="Secuencia">Secuencia</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Bloque
            </label>
            <input
              type="text"
              value={newQuestion.blockName || ''}
              onChange={(e) => setNewQuestion({ ...newQuestion, blockName: e.target.value })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
              placeholder="Ej: Bloque de Sinónimos Básicos"
            />
          </div>

          {(selectedType === 'Texto' || selectedType === 'Distracción') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pregunta
                </label>
                <input
                  type="text"
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion(prev => ({
                    ...prev,
                    text: e.target.value
                  }))}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Escribe la pregunta..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opciones
                </label>
                <div className="space-y-2">
                  {newQuestion.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(newQuestion.options || [])];
                          newOptions[index] = e.target.value;
                          setNewQuestion(prev => ({
                            ...prev,
                            options: newOptions
                          }));
                        }}
                        className="flex-1 p-2 border rounded-lg"
                        placeholder={`Opción ${index + 1}`}
                      />
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={newQuestion.correctAnswer === index}
                        onChange={() => setNewQuestion(prev => ({
                          ...prev,
                          correctAnswer: index
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {selectedType === 'Memoria' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URLs de Imágenes
              </label>
              <div className="space-y-2">
                {(newQuestion.images || ['']).map((url, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => {
                        const newImages = [...(newQuestion.images || [])];
                        newImages[index] = e.target.value;
                        setNewQuestion(prev => ({
                          ...prev,
                          images: newImages
                        }));
                      }}
                      className="flex-1 p-2 border rounded-lg"
                      placeholder="URL de la imagen..."
                    />
                    <input
                      type="radio"
                      name="correctImageIndex"
                      checked={newQuestion.correctImageIndex === index}
                      onChange={() => setNewQuestion(prev => ({
                        ...prev,
                        correctImageIndex: index
                      }))}
                    />
                    <button
                      onClick={() => {
                        const newImages = [...(newQuestion.images || [])];
                        if (newImages.length > 2) {
                          newImages.splice(index, 1);
                        }
                        setNewQuestion(prev => ({
                          ...prev,
                          images: newImages
                        }));
                      }}
                      className="px-2 py-1 bg-red-600 text-white rounded"
                      disabled={newQuestion.images?.length <= 2}
                    >
                      -
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setNewQuestion(prev => ({
                    ...prev,
                    images: [...(prev.images || []), '']
                  }))}
                  className="px-4 py-2 bg-[#91c26a] text-white rounded-lg"
                >
                  Añadir Imagen
                </button>
              </div>
            </div>
          )}

          {selectedType === 'Secuencia' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secuencia de Números
              </label>
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="text"
                  value={newQuestion.sequence?.join(', ') || ''}
                  onChange={(e) => {
                    const numbers = e.target.value
                      .split(',')
                      .map(n => parseInt(n.trim()))
                      .filter(n => !isNaN(n));
                    setNewQuestion(prev => ({
                      ...prev,
                      sequence: numbers
                    }));
                  }}
                  className="flex-1 p-2 border rounded-lg"
                  placeholder="Ejemplo: 1, 3, 5, 7"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opciones de Respuesta
                </label>
                <div className="space-y-2">
                  {newQuestion.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(newQuestion.options || [])];
                          newOptions[index] = e.target.value;
                          setNewQuestion(prev => ({
                            ...prev,
                            options: newOptions
                          }));
                        }}
                        className="flex-1 p-2 border rounded-lg"
                        placeholder={`Opción ${index + 1}`}
                      />
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={newQuestion.correctAnswer === index}
                        onChange={() => setNewQuestion(prev => ({
                          ...prev,
                          correctAnswer: index
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleAddQuestion}
            className="w-full px-4 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b] transition-colors"
          >
            Crear Pregunta
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Preguntas Existentes</h2>
        
        <div className="space-y-4">
          {questions.map(question => (
            <div
              key={question.id}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex space-x-2 mb-2">
                    <span className="inline-block px-2 py-1 text-sm bg-gray-200 rounded">
                      {question.type}
                    </span>
                    {question.blockId && blocks.find(b => b.id === question.blockId) && (
                      <span className="inline-block px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                        {blocks.find(b => b.id === question.blockId)?.title}
                      </span>
                    )}
                  </div>
                  {question.text && (
                    <p className="font-medium">{question.text}</p>
                  )}
                  {question.options && (
                    <ul className="mt-2 space-y-1">
                      {question.options.map((option, index) => (
                        <li
                          key={index}
                          className={`text-sm ${
                            index === question.correctAnswer
                              ? 'text-green-600 font-medium'
                              : 'text-gray-600'
                          }`}
                        >
                          {option}
                        </li>
                      ))}
                    </ul>
                  )}
                  {question.sequence && (
                    <p className="text-sm text-gray-600 mt-2">
                      Secuencia: {question.sequence.join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionManager;

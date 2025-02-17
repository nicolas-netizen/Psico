import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-hot-toast';

interface Question {
  type: string;
  question: string;
  options: string[];
  correctAnswer: number;
  images?: string[];
  correctImageIndex?: number;
  distractionQuestion?: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
}

interface TestBlock {
  id?: string;
  type: string;
  name: string;
  description: string;
  defaultQuantity: number;
  questions: Question[];
}

const BlockManager: React.FC = () => {
  const [blocks, setBlocks] = useState<TestBlock[]>([]);
  const [showNewBlockForm, setShowNewBlockForm] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<TestBlock | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [blockType, setBlockType] = useState('');
  const [blockName, setBlockName] = useState('');
  const [blockDescription, setBlockDescription] = useState('');
  const [defaultQuantity, setDefaultQuantity] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'multiple_choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  });

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    try {
      const blocksRef = collection(db, 'testBlocks');
      const snapshot = await getDocs(blocksRef);
      const blocksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TestBlock[];
      setBlocks(blocksData);
    } catch (error) {
      console.error('Error loading blocks:', error);
      toast.error('Error al cargar los bloques');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (questions.length === 0) {
      toast.error('Debes agregar al menos una pregunta al bloque');
      return;
    }

    try {
      const newBlock: Omit<TestBlock, 'id'> = {
        type: blockType,
        name: blockName,
        description: blockDescription,
        defaultQuantity,
        questions
      };

      await addDoc(collection(db, 'testBlocks'), newBlock);
      toast.success('Bloque creado exitosamente');
      resetForm();
      loadBlocks();
    } catch (error) {
      console.error('Error creating block:', error);
      toast.error('Error al crear el bloque');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este bloque?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'testBlocks', blockId));
      toast.success('Bloque eliminado exitosamente');
      loadBlocks();
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Error al eliminar el bloque');
    }
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.question || currentQuestion.options?.some(opt => !opt)) {
      toast.error('Completa todos los campos de la pregunta');
      return;
    }

    setQuestions([...questions, currentQuestion as Question]);
    setCurrentQuestion({
      type: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const resetForm = () => {
    setBlockType('');
    setBlockName('');
    setBlockDescription('');
    setDefaultQuantity(1);
    setQuestions([]);
    setCurrentQuestion({
      type: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    });
    setShowNewBlockForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Bloques</h2>
        <button
          onClick={() => setShowNewBlockForm(!showNewBlockForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {showNewBlockForm ? 'Cancelar' : 'Crear Nuevo Bloque'}
        </button>
      </div>

      {showNewBlockForm && (
        <form onSubmit={handleCreateBlock} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Bloque
                <input
                  type="text"
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre
                <input
                  type="text"
                  value={blockName}
                  onChange={(e) => setBlockName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descripción
              <textarea
                value={blockDescription}
                onChange={(e) => setBlockDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={3}
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cantidad por Defecto
              <input
                type="number"
                value={defaultQuantity}
                onChange={(e) => setDefaultQuantity(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                min="1"
                required
              />
            </label>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Agregar Pregunta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pregunta
                  <input
                    type="text"
                    value={currentQuestion.question}
                    onChange={(e) =>
                      setCurrentQuestion({ ...currentQuestion, question: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Opciones</p>
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={currentQuestion.correctAnswer === index}
                      onChange={() =>
                        setCurrentQuestion({ ...currentQuestion, correctAnswer: index })
                      }
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Opción ${index + 1}`}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Agregar Pregunta
              </button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Preguntas Agregadas ({questions.length})</h3>
            <ul className="space-y-2">
              {questions.map((q, index) => (
                <li key={index} className="p-2 bg-gray-50 rounded">
                  <p className="font-medium">{q.question}</p>
                  <ul className="ml-4 text-sm text-gray-600">
                    {q.options.map((opt, optIndex) => (
                      <li key={optIndex} className={optIndex === q.correctAnswer ? 'text-green-600 font-medium' : ''}>
                        {optIndex + 1}. {opt}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Crear Bloque
            </button>
          </div>
        </form>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {blocks.map((block) => (
            <li key={block.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{block.name}</h3>
                  <p className="text-sm text-gray-500">{block.description}</p>
                  <p className="text-sm text-gray-500">
                    Tipo: {block.type} | Preguntas: {block.questions.length} |
                    Cantidad por defecto: {block.defaultQuantity}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => block.id && handleDeleteBlock(block.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BlockManager;

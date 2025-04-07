import React, { useState } from 'react';
import { auth } from '../../firebase/firebaseConfig';
import { Test, Block, Question, Option } from '../../types/test';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface TestFormProps {
  onSubmit: (test: Omit<Test, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const TestForm: React.FC<TestFormProps> = ({ onSubmit }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentBlock, setCurrentBlock] = useState<Omit<Block, 'id'>>({
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentBlock, setCurrentBlock] = useState<Omit<Block, 'id'>>({
    name: '',
    description: '',
    timeLimit: 7,
    questions: [],
    showExplanation: false
  });
  const navigate = useNavigate();

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: 'text',
      text: '',
      options: [],
      correctAnswer: 0
    };

    setCurrentBlock(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: Date.now().toString(),
          text: '',
          options: ['', '', '', ''],
          correctAnswer: 0
        }
      ]
    }));
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    setCurrentBlock(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { 
          ...q, 
          [field]: value,
          type: q.type || 'text'
        } : q
      )
    }));
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    setCurrentBlock(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? {
          ...q,
          options: q.options.map((opt, j) => 
            j === optionIndex ? { 
              id: (opt as Option).id || Date.now().toString(),
              text: value,
              isCorrect: (opt as Option).isCorrect || false
            } : opt
          )
        } : q
      )
    }));
  };

  const handleCorrectAnswerChange = (questionIndex: number, optionIndex: number) => {
    setCurrentBlock(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? {
          ...q,
          options: q.options.map((opt, j) => ({
            ...opt,
            isCorrect: j === optionIndex
          })),
          correctAnswer: optionIndex
        } : q
      )
    }));
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? { ...q, correctAnswer: value } : q
      )
    }));
  };

  const handleAddBlock = () => {
    if (!currentBlock.name || currentBlock.questions.length === 0) {
      toast.error('El bloque debe tener un título y al menos una pregunta');
      return;
    }

    const newBlock: Block = {
      ...currentBlock,
      id: Date.now().toString(),
      questions: currentBlock.questions.map(q => ({
        ...q,
        type: q.type || 'text',
        options: q.options.map(opt => ({
          id: (opt as Option).id || Date.now().toString(),
          text: (opt as Option).text || '',
          isCorrect: (opt as Option).isCorrect || false
        }))
      }))
    };

    setBlocks(prev => [...prev, newBlock]);
    setCurrentBlock({
      name: '',
      description: '',
      timeLimit: 7,
      questions: [],
      showExplanation: false
    });
      const newBlock: Block = {
        ...currentBlock,
        id: Date.now().toString(),
        questions: currentBlock.questions.map(q => ({
          ...q,
          type: q.type || 'text',
          options: q.options.map(opt => ({
            id: (opt as Option).id || Date.now().toString(),
            text: (opt as Option).text || '',
            isCorrect: (opt as Option).isCorrect || false
          }))
        }))
      };
      setBlocks(prev => [...prev, newBlock]);
      setCurrentBlock({
        name: '',
        description: '',
        timeLimit: 7,
        questions: [],
        showExplanation: false
      });
    };
    addBlock();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || blocks.length === 0) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      await onSubmit({
        title,
        description,
        blocks,
        createdBy: auth.currentUser?.uid || '',
        isPublic: false
      });
      toast.success('Test creado exitosamente');
      navigate('/admin/tests');
    } catch (error) {
      toast.error('Error al crear el test');
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Crear Nuevo Test</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={3}
            required
          />
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4">Bloques</h3>
          {blocks.map((block, index) => (
            <div key={block.id} className="mb-4 p-4 border rounded">
              <h4 className="font-bold">{block.name}</h4>
              <p className="text-gray-600">{block.description}</p>
              <p className="text-sm text-gray-500">
                {block.questions.length} preguntas
              </p>
            </div>
          ))}

          <div className="mb-4 p-4 border rounded">
            <h4 className="font-bold mb-4">Nuevo Bloque</h4>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Nombre del Bloque
              </label>
              <input
                type="text"
                value={currentBlock.name}
                onChange={(e) =>
                  setCurrentBlock(prev => ({ ...prev, name: e.target.value }))
                }
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Descripción del Bloque
              </label>
              <textarea
                value={currentBlock.description || ''}
                onChange={(e) =>
                  setCurrentBlock(prev => ({ ...prev, description: e.target.value }))
                }
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={2}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Tiempo Límite (minutos)
              </label>
              <input
                type="number"
                value={currentBlock.timeLimit || 7}
                onChange={(e) =>
                  setCurrentBlock(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))
                }
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                min={1}
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={currentBlock.showExplanation || false}
                  onChange={(e) =>
                    setCurrentBlock(prev => ({ ...prev, showExplanation: e.target.checked }))
                  }
                  className="mr-2"
                />
                <span className="text-gray-700 text-sm font-bold">Mostrar Explicación</span>
              </label>
            </div>

            <div className="mb-4">
              <h5 className="font-bold mb-2">Preguntas</h5>
              {currentBlock.questions.map((question, qIndex) => (
                <div key={question.id} className="mb-4 p-3 border rounded">
                  <div className="mb-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Pregunta {qIndex + 1}
                    </label>
                    <input
                      type="text"
                      value={question.text || ''}
                      onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>

                  <div className="mb-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Tipo de Pregunta
                    </label>
                    <select
                      value={question.type}
                      onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value as Question['type'])}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                      <option value="text">Texto</option>
                      <option value="image">Imagen</option>
                      <option value="mixed">Mixta</option>
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Opciones
                    </label>
                    {question.options.map((option, oIndex) => (
                      <div key={option.id} className="flex items-center mb-2">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={oIndex === question.correctAnswer}
                          onChange={() => handleCorrectAnswerChange(qIndex, oIndex)}
                          className="mr-2"
                        />
                        <input
                          type="text"
                          value={(option as Option).text}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddOption(qIndex)}
                      className="mt-2 bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600"
                    >
                      Agregar Opción
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddQuestion}
                className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
              >
                Agregar Pregunta
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddBlock}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Guardar Bloque
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Crear Test
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestForm;
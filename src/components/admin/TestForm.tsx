import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Test, TestBlock } from '../../types/Test';
import { toast } from 'react-toastify';

interface TestFormProps {
  onSubmit: (test: Omit<Test, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const TestForm: React.FC<TestFormProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [blocks, setBlocks] = useState<Omit<TestBlock, 'id'>[]>([]);
  const [currentBlock, setCurrentBlock] = useState<Omit<TestBlock, 'id'>>({
    title: '',
    description: '',
    timeLimit: 7,
    type: 'verbal',
    questions: []
  });
  const navigate = useNavigate();

  const handleAddQuestion = () => {
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

  const handleQuestionChange = (index: number, field: string, value: string) => {
    setCurrentBlock(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    setCurrentBlock(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? {
          ...q,
          options: q.options.map((opt, j) => j === optionIndex ? value : opt)
        } : q
      )
    }));
  };

  const handleCorrectAnswerChange = (questionIndex: number, value: number) => {
    setCurrentBlock(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? { ...q, correctAnswer: value } : q
      )
    }));
  };

  const handleAddBlock = () => {
    if (!currentBlock.title || currentBlock.questions.length === 0) {
      toast.error('El bloque debe tener un título y al menos una pregunta');
      return;
    }

    setBlocks(prev => [...prev, currentBlock]);
    setCurrentBlock({
      title: '',
      description: '',
      timeLimit: 7,
      type: 'verbal',
      questions: []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || blocks.length === 0) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      await onSubmit({
        title,
        description,
        blocks: blocks.map(block => ({
          ...block,
          id: Date.now().toString()
        }))
      });
      toast.success('Test creado exitosamente');
      navigate('/admin/tests');
    } catch (error) {
      console.error('Error al crear el test:', error);
      toast.error('Error al crear el test');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6">Información General</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Título del Test
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
                rows={3}
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6">Bloques del Test</h2>
          
          {/* Lista de bloques agregados */}
          {blocks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Bloques creados:</h3>
              <div className="space-y-4">
                {blocks.map((block, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{block.title}</h4>
                      <span className="text-sm text-gray-500">
                        {block.questions.length} preguntas - {block.timeLimit} minutos
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulario del bloque actual */}
          <div className="space-y-4">
            <div>
              <label htmlFor="blockTitle" className="block text-sm font-medium text-gray-700">
                Título del Bloque
              </label>
              <input
                type="text"
                id="blockTitle"
                value={currentBlock.title}
                onChange={(e) => setCurrentBlock(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="blockDescription" className="block text-sm font-medium text-gray-700">
                Descripción del Bloque
              </label>
              <textarea
                id="blockDescription"
                value={currentBlock.description}
                onChange={(e) => setCurrentBlock(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="blockType" className="block text-sm font-medium text-gray-700">
                  Tipo de Bloque
                </label>
                <select
                  id="blockType"
                  value={currentBlock.type}
                  onChange={(e) => setCurrentBlock(prev => ({ ...prev, type: e.target.value as 'verbal' | 'numerical' | 'abstract' }))}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
                >
                  <option value="verbal">Verbal</option>
                  <option value="numerical">Numérico</option>
                  <option value="abstract">Abstracto</option>
                </select>
              </div>

              <div>
                <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700">
                  Tiempo Límite (minutos)
                </label>
                <input
                  type="number"
                  id="timeLimit"
                  value={currentBlock.timeLimit}
                  onChange={(e) => setCurrentBlock(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
                  min="1"
                />
              </div>
            </div>

            {/* Preguntas del bloque */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Preguntas</h3>
              {currentBlock.questions.map((question, qIndex) => (
                <div key={question.id} className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Pregunta {qIndex + 1}
                    </label>
                    <input
                      type="text"
                      value={question.text}
                      onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                      className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
                      placeholder="Escribe la pregunta..."
                    />
                  </div>

                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correctAnswer === oIndex}
                          onChange={() => handleCorrectAnswerChange(qIndex, oIndex)}
                          className="h-4 w-4 text-[#91c26a] focus:ring-[#91c26a] border-gray-300"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
                          placeholder={`Opción ${oIndex + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddQuestion}
                className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                + Agregar Pregunta
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddBlock}
                className="bg-[#91c26a] text-white py-2 px-4 rounded-lg hover:bg-[#7ea756] transition-colors duration-200"
              >
                Guardar Bloque
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/tests')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-[#91c26a] text-white py-2 px-4 rounded-lg hover:bg-[#7ea756] transition-colors duration-200"
          >
            Crear Test
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestForm;
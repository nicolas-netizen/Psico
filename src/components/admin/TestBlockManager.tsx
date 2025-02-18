import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, getDocs, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-toastify';
import { AptitudeCategory } from '../../types/test';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface TestBlock {
  id?: string;
  name: string;
  category: AptitudeCategory;
  description: string;
  questions: string[]; // Array of question IDs
  difficulty: 'Fácil' | 'Intermedio' | 'Difícil';
}

const TestBlockManager = () => {
  const [blocks, setBlocks] = useState<TestBlock[]>([]);
  const [currentBlock, setCurrentBlock] = useState<TestBlock>({
    name: '',
    category: AptitudeCategory.SYNONYMS,
    description: '',
    questions: [],
    difficulty: 'Intermedio'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);

  useEffect(() => {
    loadBlocks();
    loadAvailableQuestions();
  }, []);

  const loadBlocks = async () => {
    try {
      const blocksRef = collection(db, 'testBlocks');
      const querySnapshot = await getDocs(blocksRef);
      const blocksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TestBlock[];
      setBlocks(blocksData);
    } catch (error) {
      console.error('Error loading blocks:', error);
      toast.error('Error al cargar los bloques de preguntas');
    }
  };

  const loadAvailableQuestions = async () => {
    try {
      const questionsRef = collection(db, 'questions');
      const querySnapshot = await getDocs(questionsRef);
      const questionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableQuestions(questionsData);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Error al cargar las preguntas disponibles');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && currentBlock.id) {
        const blockRef = doc(db, 'testBlocks', currentBlock.id);
        await updateDoc(blockRef, {
          ...currentBlock,
          updatedAt: new Date()
        });
        toast.success('Bloque actualizado exitosamente');
      } else {
        await addDoc(collection(db, 'testBlocks'), {
          ...currentBlock,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        toast.success('Bloque creado exitosamente');
      }
      resetForm();
      loadBlocks();
    } catch (error) {
      console.error('Error saving block:', error);
      toast.error('Error al guardar el bloque');
    }
  };

  const handleEdit = (block: TestBlock) => {
    setCurrentBlock(block);
    setIsEditing(true);
  };

  const handleDelete = async (blockId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este bloque?')) {
      try {
        await deleteDoc(doc(db, 'testBlocks', blockId));
        toast.success('Bloque eliminado exitosamente');
        loadBlocks();
      } catch (error) {
        console.error('Error deleting block:', error);
        toast.error('Error al eliminar el bloque');
      }
    }
  };

  const resetForm = () => {
    setCurrentBlock({
      name: '',
      category: AptitudeCategory.SYNONYMS,
      description: '',
      questions: [],
      difficulty: 'Intermedio'
    });
    setIsEditing(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Gestión de Bloques de Preguntas</h2>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Bloque
            </label>
            <input
              type="text"
              value={currentBlock.name}
              onChange={(e) => setCurrentBlock({...currentBlock, name: e.target.value})}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={currentBlock.category}
              onChange={(e) => setCurrentBlock({...currentBlock, category: e.target.value as AptitudeCategory})}
              className="w-full p-2 border rounded-md"
              required
            >
              {Object.values(AptitudeCategory).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dificultad
            </label>
            <select
              value={currentBlock.difficulty}
              onChange={(e) => setCurrentBlock({...currentBlock, difficulty: e.target.value as 'Fácil' | 'Intermedio' | 'Difícil'})}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="Fácil">Fácil</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Difícil">Difícil</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={currentBlock.description}
              onChange={(e) => setCurrentBlock({...currentBlock, description: e.target.value})}
              className="w-full p-2 border rounded-md"
              rows={3}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preguntas
            </label>
            <select
              multiple
              value={currentBlock.questions}
              onChange={(e) => setCurrentBlock({
                ...currentBlock,
                questions: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className="w-full p-2 border rounded-md"
              size={5}
              required
            >
              {availableQuestions
                .filter(q => q.category === currentBlock.category)
                .map((question) => (
                  <option key={question.id} value={question.id}>
                    {question.text}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#91c26a] text-white rounded-md hover:bg-[#82b35b]"
          >
            {isEditing ? 'Actualizar' : 'Crear'} Bloque
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blocks.map((block) => (
          <div key={block.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{block.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(block)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => block.id && handleDelete(block.id)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{block.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {block.category}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {block.difficulty}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {block.questions.length} preguntas
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestBlockManager;

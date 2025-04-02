import { useState, useEffect, FC } from 'react';
import { collection, addDoc, query, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-hot-toast';
import { Block, BlockType, BLOCK_TYPES, BLOCK_NAMES } from '../../types/blocks';

interface Question {
  id: string;
  type: 'Texto' | 'Memoria' | 'Distracción' | 'Secuencia' | 'TextoImagen';
  blockType: BlockType;
  blockName: string;
  text?: string;
  options?: string[];
  correctAnswer?: number;
  images?: string[];
  correctImageIndex?: number;
  sequence?: string[];
  isPublic: boolean;
}

const QuestionManager: FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<Question['type']>('Texto');
  const [selectedBlockType, setSelectedBlockType] = useState<BlockType>('AptitudVerbal');
  const [newQuestion, setNewQuestion] = useState<Omit<Question, 'id'>>({
    type: 'Texto',
    blockType: 'AptitudVerbal',
    blockName: BLOCK_NAMES.AptitudVerbal,
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    isPublic: true,
    images: []
  });

  useEffect(() => {
    loadQuestions();
  }, []);

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
      if (selectedType === 'Texto' || selectedType === 'Distracción' || selectedType === 'TextoImagen') {
        if (!newQuestion.text || newQuestion.text.trim() === '') {
          toast.error('La pregunta debe tener un texto');
          return;
        }
        if (!newQuestion.options || newQuestion.options.some(opt => opt.trim() === '')) {
          toast.error('Todas las opciones deben estar completas');
          return;
        }
        if (selectedType === 'TextoImagen' && (!newQuestion.images || newQuestion.images.length === 0)) {
          toast.error('Debe incluir al menos una imagen');
          return;
        }
      } else if (selectedType === 'Memoria') {
        if (!newQuestion.images || newQuestion.images.length < 2) {
          toast.error('Debe haber al menos 2 imágenes');
          return;
        }
      } else if (selectedType === 'Secuencia') {
        if (!newQuestion.sequence || newQuestion.sequence.length < 3) {
          toast.error('La secuencia debe tener al menos 3 números o texto');
          return;
        }
      }

      const questionData = {
        ...newQuestion,
        blockType: selectedBlockType,
        blockName: BLOCK_NAMES[selectedBlockType],
        createdAt: new Date()
      };

      await addDoc(collection(db, 'questions'), questionData);
      toast.success('Pregunta creada con éxito');
      loadQuestions();

      // Resetear el formulario
      setNewQuestion({
        type: selectedType,
        blockType: selectedBlockType,
        blockName: BLOCK_NAMES[selectedBlockType],
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        isPublic: true,
        images: []
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
      sequence: []
    }));
  };

  const handleBlockTypeChange = (blockType: BlockType) => {
    setSelectedBlockType(blockType);
    setNewQuestion(prev => ({
      ...prev,
      blockType,
      blockName: BLOCK_NAMES[blockType]
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
              <option value="TextoImagen">Texto con Imagen</option>
              <option value="Memoria">Memoria</option>
              <option value="Distracción">Distracción</option>
              <option value="Secuencia">Secuencia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Bloque
            </label>
            <select
              value={selectedBlockType}
              onChange={(e) => handleBlockTypeChange(e.target.value as BlockType)}
              className="w-full p-2 border rounded-lg"
            >
              {BLOCK_TYPES.map(blockType => (
                <option key={blockType} value={blockType}>
                  {BLOCK_NAMES[blockType]}
                </option>
              ))}
            </select>
          </div>

          {(selectedType === 'Texto' || selectedType === 'Distracción' || selectedType === 'TextoImagen') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pregunta
                </label>
                <textarea
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opciones
                </label>
                {newQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="radio"
                      checked={newQuestion.correctAnswer === index}
                      onChange={() => setNewQuestion({ ...newQuestion, correctAnswer: index })}
                      className="mr-2"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(newQuestion.options || [])];
                        newOptions[index] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: newOptions });
                      }}
                      className="w-full p-2 border rounded-lg"
                      placeholder={`Opción ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {(selectedType === 'TextoImagen' || selectedType === 'Memoria') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URLs de Imágenes
              </label>
              {newQuestion.images?.map((image, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="radio"
                    checked={newQuestion.correctImageIndex === index}
                    onChange={() => setNewQuestion({ ...newQuestion, correctImageIndex: index })}
                    className="mr-2"
                  />
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => {
                      const newImages = [...(newQuestion.images || [])];
                      newImages[index] = e.target.value;
                      setNewQuestion({ ...newQuestion, images: newImages });
                    }}
                    className="w-full p-2 border rounded-lg"
                    placeholder={`URL de imagen ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = [...(newQuestion.images || []), ''];
                      setNewQuestion({ ...newQuestion, images: newImages });
                    }}
                    className="ml-2 px-3 py-1 bg-[#91c26a] text-white rounded-lg"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedType === 'Secuencia' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Elementos de la Secuencia
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newQuestion.sequence?.join(', ') || ''}
                  onChange={(e) => {
                    const sequence = e.target.value.split(',').map(item => item.trim());
                    setNewQuestion({ ...newQuestion, sequence });
                  }}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Elementos separados por comas"
                />
              </div>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={newQuestion.isPublic}
              onChange={(e) => setNewQuestion({ ...newQuestion, isPublic: e.target.checked })}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">
              Pregunta pública
            </label>
          </div>

          <button
            onClick={handleAddQuestion}
            className="w-full bg-[#91c26a] text-white py-2 rounded-lg hover:bg-[#7ea756] transition-colors"
          >
            Crear Pregunta
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Preguntas Existentes</h2>
        <div className="space-y-4">
          {questions.map((question) => (
            <div key={question.id} className="border p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{question.text || 'Pregunta sin texto'}</p>
                  <p className="text-sm text-gray-600">Tipo: {question.type}</p>
                  <p className="text-sm text-gray-600">Bloque: {question.blockName}</p>
                </div>
                <button
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionManager;

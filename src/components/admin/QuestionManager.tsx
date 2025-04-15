import { FC, useEffect, useState } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-hot-toast';
import { BlockType, BLOCK_NAMES } from '../../types/blocks';
import ImageUploader from './ImageUploader';
import { TrashIcon } from 'lucide-react';
import { CLOUDINARY_FOLDERS } from '../../utils/imageUtils';

// Tipos de preguntas
type QuestionType = 'Texto' | 'Memoria' | 'Distracción' | 'Secuencia' | 'TextoImagen' | 'MemoriaDistractor';

interface BaseQuestion {
  id?: string;
  type: QuestionType;
  blockType: BlockType;
  blockName: string;
  isPublic: boolean;
  createdAt: Date;
}

interface QuestionData {
  id?: string;
  type: QuestionType;
  blockType: BlockType;
  blockName: string;
  text?: string;
  options?: string[];
  correctAnswer?: string | number;
  isPublic: boolean;
  createdAt: Date;
  imageUrl?: string;
  images?: string[];
  correctImageIndex?: number;
  memoryTime?: number;
  sequence?: string[];
  distractor?: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
  realQuestion?: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
}

interface TextQuestion extends QuestionData {
  type: 'Texto' | 'TextoImagen';
  text: string;
  options: string[];
  correctAnswer: number;
  imageUrl?: string;
}

interface MemoryQuestion extends QuestionData {
  type: 'Memoria';
  text?: string;
  images: string[];
  correctImageIndex: number;
  memoryTime?: number; // Tiempo en segundos para memorizar la imagen
}

interface MemoryDistractorQuestion extends QuestionData {
  type: 'MemoriaDistractor';
  text?: string;
  images: string[];
  correctImageIndex: number;
  memoryTime?: number; // Tiempo en segundos para memorizar la imagen (por defecto 6)
  distractor: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
  realQuestion: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
}

interface DistractionQuestion extends QuestionData {
  type: 'Distracción';
  text: string;
  options: string[];
  correctAnswer: number;
}

interface SequenceQuestion extends QuestionData {
  type: 'Secuencia';
  sequence: string[];
}

type Question = {
  id: string;
  data: QuestionData;
};

const initialQuestion: TextQuestion = {
  type: 'Texto',
  blockType: 'AptitudVerbal',
  blockName: BLOCK_NAMES.AptitudVerbal,
  text: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  isPublic: true,
  createdAt: new Date()
};

const QuestionManager: FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<QuestionData['type']>('Texto');
  const [selectedBlockType, setSelectedBlockType] = useState<BlockType>('AptitudVerbal');
  const [newQuestion, setNewQuestion] = useState<QuestionData>(initialQuestion);

  // Función auxiliar para type guard
  const isTextQuestion = (question: QuestionData): question is TextQuestion => {
    return ['Texto', 'TextoImagen'].includes(question.type);
  };

  const isMemoryQuestion = (question: QuestionData): question is MemoryQuestion => {
    return question.type === 'Memoria';
  };

  const isMemoryDistractorQuestion = (question: QuestionData): question is MemoryDistractorQuestion => {
    return question.type === 'MemoriaDistractor';
  };

  const isSequenceQuestion = (question: QuestionData): question is SequenceQuestion => {
    return question.type === 'Secuencia';
  };

  const isDistractionQuestion = (question: QuestionData): question is DistractionQuestion => {
    return question.type === 'Distracción';
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const questionsQuery = query(collection(db, 'questions'));
      const snapshot = await getDocs(questionsQuery);
      const loadedQuestions = snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data() as QuestionData
      })) as Question[];
      setQuestions(loadedQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Error al cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: QuestionData['type']) => {
    setSelectedType(type);
    
    // Crear el nuevo estado según el tipo
    let newState: QuestionData;
    
    if (type === 'Memoria') {
      newState = {
        type: 'Memoria',
        blockType: selectedBlockType,
        blockName: BLOCK_NAMES[selectedBlockType],
        images: [],
        correctImageIndex: 0,
        memoryTime: 6, // Por defecto 6 segundos
        isPublic: true,
        createdAt: new Date()
      };
    } else if (type === 'MemoriaDistractor') {
      newState = {
        type: 'MemoriaDistractor',
        blockType: selectedBlockType,
        blockName: BLOCK_NAMES[selectedBlockType],
        images: [],
        correctImageIndex: 0,
        memoryTime: 6, // Por defecto 6 segundos
        distractor: {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0
        },
        realQuestion: {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0
        },
        isPublic: true,
        createdAt: new Date()
      };
    } else if (type === 'Secuencia') {
      newState = {
        type: 'Secuencia',
        blockType: selectedBlockType,
        blockName: BLOCK_NAMES[selectedBlockType],
        sequence: [],
        isPublic: true,
        createdAt: new Date()
      };
    } else if (type === 'Distracción') {
      newState = {
        type: 'Distracción',
        blockType: selectedBlockType,
        blockName: BLOCK_NAMES[selectedBlockType],
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        isPublic: true,
        createdAt: new Date()
      };
    } else {
      newState = {
        type: type as 'Texto' | 'TextoImagen',
        blockType: selectedBlockType,
        blockName: BLOCK_NAMES[selectedBlockType],
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        isPublic: true,
        createdAt: new Date()
      };
    }
    
    setNewQuestion(newState);
  };

  const handleAddQuestion = async () => {
    try {
      // Validar la pregunta según su tipo
      if (isTextQuestion(newQuestion)) {
        if (!newQuestion.text || newQuestion.text.trim() === '') {
          toast.error('La pregunta debe tener un texto');
          return;
        }
        if (!newQuestion.options || newQuestion.options.some(opt => opt.trim() === '')) {
          toast.error('Todas las opciones deben estar completas');
          return;
        }
        if (newQuestion.type === 'TextoImagen' && (!newQuestion.imageUrl || newQuestion.imageUrl.trim() === '')) {
          toast.error('Debe incluir una imagen');
          return;
        }
      } else if (isMemoryQuestion(newQuestion)) {
        if (!newQuestion.images || newQuestion.images.length < 2) {
          toast.error('Debe haber al menos 2 imágenes');
          return;
        }
      } else if (isMemoryDistractorQuestion(newQuestion)) {
        if (!newQuestion.images || newQuestion.images.length === 0) {
          toast.error('Debe incluir al menos una imagen para memorizar');
          return;
        }
        if (!newQuestion.distractor.question || newQuestion.distractor.question.trim() === '') {
          toast.error('La pregunta de distracción debe tener un texto');
          return;
        }
        if (!newQuestion.distractor.options || newQuestion.distractor.options.some(opt => opt.trim() === '')) {
          toast.error('Todas las opciones de la pregunta de distracción deben estar completas');
          return;
        }
        if (!newQuestion.realQuestion.question || newQuestion.realQuestion.question.trim() === '') {
          toast.error('La pregunta real debe tener un texto');
          return;
        }
        if (!newQuestion.realQuestion.options || newQuestion.realQuestion.options.some(opt => opt.trim() === '')) {
          toast.error('Todas las opciones de la pregunta real deben estar completas');
          return;
        }
      } else if (isSequenceQuestion(newQuestion)) {
        if (!newQuestion.sequence || newQuestion.sequence.length < 3) {
          toast.error('La secuencia debe tener al menos 3 números o texto');
          return;
        }
      } else if (isDistractionQuestion(newQuestion)) {
        if (!newQuestion.text || newQuestion.text.trim() === '') {
          toast.error('La pregunta debe tener un texto');
          return;
        }
        if (!newQuestion.options || newQuestion.options.some(opt => opt.trim() === '')) {
          toast.error('Todas las opciones deben estar completas');
          return;
        }
      }

      const questionData = {
        ...newQuestion,
        blockType: selectedBlockType,
        blockName: BLOCK_NAMES[selectedBlockType],
        isPublic: true,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'questions'), questionData);
      toast.success('Pregunta creada con éxito');
      loadQuestions();

      // Resetear el formulario al estado inicial
      setNewQuestion(initialQuestion);
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('Error al crear la pregunta');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'questions', id));
      toast.success('Pregunta eliminada con éxito');
      loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Error al eliminar la pregunta');
    }
  };

  const handleBlockTypeChange = (blockType: BlockType) => {
    setSelectedBlockType(blockType);
    setNewQuestion(prev => ({
      ...prev,
      blockType,
      blockName: BLOCK_NAMES[blockType]
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    if (!isTextQuestion(newQuestion) && !isDistractionQuestion(newQuestion)) return;
    
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion({
      ...newQuestion,
      options: newOptions
    } as TextQuestion | DistractionQuestion);
  };

  const handleCorrectAnswerChange = (index: number) => {
    if (!isTextQuestion(newQuestion) && !isDistractionQuestion(newQuestion)) return;
    
    setNewQuestion({
      ...newQuestion,
      correctAnswer: index
    } as TextQuestion | DistractionQuestion);
  };

  const handleImageUpload = (imageUrl: string) => {
    if (!isTextQuestion(newQuestion) || newQuestion.type !== 'TextoImagen') return;
    
    setNewQuestion({
      ...newQuestion,
      imageUrl
    } as TextQuestion);
  };

  const handleMemoryImageUpload = (imageUrl: string) => {
    if (!isMemoryQuestion(newQuestion) && !isMemoryDistractorQuestion(newQuestion)) return;
    
    setNewQuestion({
      ...newQuestion,
      images: [...newQuestion.images, imageUrl]
    });
  };

  const handleMemoryImageDelete = (index: number) => {
    if (!isMemoryQuestion(newQuestion) && !isMemoryDistractorQuestion(newQuestion)) return;
    
    const newImages = [...newQuestion.images];
    newImages.splice(index, 1);
    setNewQuestion({
      ...newQuestion,
      images: newImages
    });
  };

  const handleCorrectImageChange = (index: number) => {
    if (!isMemoryQuestion(newQuestion) && !isMemoryDistractorQuestion(newQuestion)) return;
    
    setNewQuestion({
      ...newQuestion,
      correctImageIndex: index
    });
  };

  const handleSequenceChange = (sequence: string[]) => {
    if (!isSequenceQuestion(newQuestion)) return;
    
    setNewQuestion({
      ...newQuestion,
      sequence
    });
  };

  const handleTextChange = (text: string) => {
    if (!isTextQuestion(newQuestion) && !isDistractionQuestion(newQuestion) && !isMemoryQuestion(newQuestion) && !isMemoryDistractorQuestion(newQuestion)) return;
    
    setNewQuestion({
      ...newQuestion,
      text
    } as TextQuestion | DistractionQuestion | MemoryQuestion | MemoryDistractorQuestion);
  };

  const handleCreateTestQuestion = () => {
    const testQuestion: MemoryDistractorQuestion = {
      type: 'MemoriaDistractor',
      text: 'Memoriza la siguiente imagen',
      images: [
        'https://example.com/image1.jpg'
      ],
      correctImageIndex: 0,
      memoryTime: 6, // 6 segundos para memorizar
      distractor: {
        question: '¿Cuál es la capital de Francia?',
        options: ['Madrid', 'París', 'Londres', 'Berlín'],
        correctAnswer: 1 // París
      },
      realQuestion: {
        question: '¿De qué color era la taza que aparecía en la imagen?',
        options: ['Roja', 'Azul', 'Verde', 'Amarilla'],
        correctAnswer: 0 // Roja
      },
      blockType: 'Memoria',
      blockName: BLOCK_NAMES.Memoria,
      isPublic: true,
      createdAt: new Date()
    };

    setNewQuestion(testQuestion);
  };

  // Función para manejar cambios en el tiempo de memorización
  const handleMemoryTimeChange = (time: number) => {
    if (!isMemoryQuestion(newQuestion) && !isMemoryDistractorQuestion(newQuestion)) return;
    
    setNewQuestion(prev => ({
      ...prev,
      memoryTime: time
    }));
  };

  // Funciones para manejar cambios en la pregunta de distracción
  const handleDistractorQuestionChange = (question: string) => {
    if (!isMemoryDistractorQuestion(newQuestion)) return;
    
    setNewQuestion(prev => ({
      ...prev,
      distractor: {
        ...prev.distractor!,
        question
      }
    }));
  };

  const handleDistractorOptionChange = (index: number, value: string) => {
    if (!isMemoryDistractorQuestion(newQuestion)) return;
    
    const newOptions = [...newQuestion.distractor!.options];
    newOptions[index] = value;
    
    setNewQuestion(prev => ({
      ...prev,
      distractor: {
        ...prev.distractor!,
        options: newOptions
      }
    }));
  };

  const handleDistractorCorrectAnswerChange = (index: number) => {
    if (!isMemoryDistractorQuestion(newQuestion)) return;
    
    setNewQuestion(prev => ({
      ...prev,
      distractor: {
        ...prev.distractor!,
        correctAnswer: index
      }
    }));
  };

  // Funciones para manejar cambios en la pregunta real
  const handleRealQuestionChange = (question: string) => {
    if (!isMemoryDistractorQuestion(newQuestion)) return;
    
    setNewQuestion(prev => ({
      ...prev,
      realQuestion: {
        ...prev.realQuestion!,
        question
      }
    }));
  };

  const handleRealOptionChange = (index: number, value: string) => {
    if (!isMemoryDistractorQuestion(newQuestion)) return;
    
    const newOptions = [...newQuestion.realQuestion!.options];
    newOptions[index] = value;
    
    setNewQuestion(prev => ({
      ...prev,
      realQuestion: {
        ...prev.realQuestion!,
        options: newOptions
      }
    }));
  };

  const handleRealCorrectAnswerChange = (index: number) => {
    if (!isMemoryDistractorQuestion(newQuestion)) return;
    
    setNewQuestion(prev => ({
      ...prev,
      realQuestion: {
        ...prev.realQuestion!,
        correctAnswer: index
      }
    }));
  };

  // Renderizado condicional según el tipo de pregunta
  const renderQuestionFields = () => {
    if (isTextQuestion(newQuestion)) {
      return (
        <>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Texto de la pregunta
            </label>
            <textarea
              value={newQuestion.text}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full p-2 border rounded-lg"
              rows={4}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Opciones
            </label>
            {newQuestion.options.map((option: string, index: number) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 p-2 border rounded-lg mr-2"
                  placeholder={`Opción ${index + 1}`}
                />
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={newQuestion.correctAnswer === index}
                  onChange={() => handleCorrectAnswerChange(index)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Correcta</span>
              </div>
            ))}
          </div>

          {newQuestion.type === 'TextoImagen' && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Imagen
              </label>
              <ImageUploader 
                onImageUploaded={handleImageUpload}
                folder={CLOUDINARY_FOLDERS.QUESTIONS}
              />
              {newQuestion.imageUrl && (
                <img
                  src={newQuestion.imageUrl}
                  alt="Preview"
                  className="mt-2 max-w-xs rounded-lg"
                />
              )}
            </div>
          )}
        </>
      );
    }

    if (isMemoryQuestion(newQuestion)) {
      return (
        <>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Texto de la pregunta
            </label>
            <textarea
              value={newQuestion.text}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full p-2 border rounded-lg"
              rows={4}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Tiempo de memorización (segundos)
            </label>
            <input
              type="number"
              value={newQuestion.memoryTime || 6}
              onChange={(e) => handleMemoryTimeChange(Number(e.target.value))}
              min={1}
              max={30}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Imágenes para memorizar
            </label>
            <ImageUploader 
              onImageUploaded={handleMemoryImageUpload}
              folder={CLOUDINARY_FOLDERS.MEMORY}
            />
            <div className="grid grid-cols-2 gap-4 mt-4">
              {newQuestion.images.map((image: string, index: number) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Imagen ${index + 1}`}
                    className="w-full rounded-lg"
                  />
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <input
                      type="radio"
                      name="correctImage"
                      checked={newQuestion.correctImageIndex === index}
                      onChange={() => handleCorrectImageChange(index)}
                      className="mr-2"
                    />
                    <button
                      onClick={() => handleMemoryImageDelete(index)}
                      className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }
    
    if (isMemoryDistractorQuestion(newQuestion)) {
      return (
        <>
          <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-bold text-lg mb-2">Pregunta de Memoria con Distractor</h3>
            <p className="text-sm text-gray-600 mb-4">
              Este tipo de pregunta muestra una imagen para memorizar, luego presenta una pregunta de distracción 
              (obligatoria pero sin puntaje), y finalmente evalúa al usuario con una pregunta relacionada con la imagen memorizada.
            </p>
          </div>
          
          {/* Configuración de la imagen a memorizar */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-bold text-md mb-2">1. Imagen para memorizar</h3>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Tiempo de memorización (segundos)
              </label>
              <input
                type="number"
                value={newQuestion.memoryTime || 6}
                onChange={(e) => handleMemoryTimeChange(Number(e.target.value))}
                min={1}
                max={30}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Imagen para memorizar
              </label>
              <ImageUploader 
                onImageUploaded={handleMemoryImageUpload}
                folder={CLOUDINARY_FOLDERS.MEMORY}
              />
              <div className="grid grid-cols-1 gap-4 mt-4">
                {newQuestion.images.map((image: string, index: number) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Imagen ${index + 1}`}
                      className="w-full rounded-lg max-h-64 object-contain"
                    />
                    <button
                      onClick={() => handleMemoryImageDelete(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Configuración de la pregunta de distracción */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-bold text-md mb-2">2. Pregunta de distracción (no evaluable)</h3>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Texto de la pregunta de distracción
              </label>
              <textarea
                value={newQuestion.distractor!.question}
                onChange={(e) => handleDistractorQuestionChange(e.target.value)}
                className="w-full p-2 border rounded-lg"
                rows={2}
                placeholder="Ej: ¿Cuál es la capital de Francia?"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Opciones (la pregunta de distracción no suma puntos)
              </label>
              {newQuestion.distractor!.options.map((option: string, index: number) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleDistractorOptionChange(index, e.target.value)}
                    className="flex-1 p-2 border rounded-lg mr-2"
                    placeholder={`Opción ${index + 1}`}
                  />
                  <input
                    type="radio"
                    name="distractorCorrectAnswer"
                    checked={newQuestion.distractor!.correctAnswer === index}
                    onChange={() => handleDistractorCorrectAnswerChange(index)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Correcta</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Configuración de la pregunta real */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-bold text-md mb-2">3. Pregunta real (evaluable)</h3>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Texto de la pregunta real
              </label>
              <textarea
                value={newQuestion.realQuestion?.question}
                onChange={(e) => handleRealQuestionChange(e.target.value)}
                className="w-full p-2 border rounded-lg"
                rows={2}
                placeholder="Ej: ¿De qué color era la taza que aparecía en la imagen?"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Opciones
              </label>
              {newQuestion.realQuestion!.options.map((option: string, index: number) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleRealOptionChange(index, e.target.value)}
                    className="flex-1 p-2 border rounded-lg mr-2"
                    placeholder={`Opción ${index + 1}`}
                  />
                  <input
                    type="radio"
                    name="realCorrectAnswer"
                    checked={newQuestion.realQuestion!.correctAnswer === index}
                    onChange={() => handleRealCorrectAnswerChange(index)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Correcta</span>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }

    if (isSequenceQuestion(newQuestion)) {
      return (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Secuencia
          </label>
          <input
            type="text"
            value={newQuestion.sequence.join(', ')}
            onChange={(e) => handleSequenceChange(e.target.value.split(',').map(s => s.trim()))}
            className="w-full p-2 border rounded-lg"
            placeholder="Ingrese los elementos separados por comas"
          />
        </div>
      );
    }

    if (isDistractionQuestion(newQuestion)) {
      return (
        <>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Texto de la pregunta
            </label>
            <textarea
              value={newQuestion.text}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full p-2 border rounded-lg"
              rows={4}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Opciones
            </label>
            {newQuestion.options.map((option: string, index: number) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 p-2 border rounded-lg mr-2"
                  placeholder={`Opción ${index + 1}`}
                />
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={newQuestion.correctAnswer === index}
                  onChange={() => handleCorrectAnswerChange(index)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Correcta</span>
              </div>
            ))}
          </div>
        </>
      );
    }

    return null;
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Administrador de Preguntas</h2>
        <button
          onClick={handleCreateTestQuestion}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Crear Pregunta de Prueba
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Crear Nueva Pregunta</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Pregunta
            </label>
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value as QuestionData['type'])}
              className="w-full p-2 border rounded-lg"
            >
              <option value="Texto">Texto</option>
              <option value="TextoImagen">Texto con Imagen</option>
              <option value="Memoria">Memoria</option>
              <option value="MemoriaDistractor">Memoria con Distractor</option>
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
              {Object.keys(BLOCK_NAMES).map(blockType => (
                <option key={blockType} value={blockType}>
                  {BLOCK_NAMES[blockType as BlockType]}
                </option>
              ))}
            </select>
          </div>

          {renderQuestionFields()}

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
                  <p className="font-medium">{question.data.text || 'Pregunta sin texto'}</p>
                  <p className="text-sm text-gray-600">Tipo: {question.data.type}</p>
                  <p className="text-sm text-gray-600">Bloque: {question.data.blockName}</p>
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

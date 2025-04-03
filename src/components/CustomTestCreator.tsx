import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Loader2, BookOpen, Calculator, Box, Wrench, Eye, Brain, Lightbulb } from 'lucide-react';
import { BlockType, BLOCK_TYPES, BLOCK_NAMES } from '../types/blocks';

type QuestionType = 'Texto' | 'Memoria' | 'Distracción' | 'Secuencia' | 'TextoImagen';

interface BaseQuestion {
  id: string;
  type: QuestionType;
  blockType: BlockType;
  blockName: string;
  isPublic: boolean;
  createdAt: Date;
}

interface TextQuestion extends BaseQuestion {
  type: 'Texto' | 'TextoImagen';
  text: string;
  options: string[];
  correctAnswer: number;
  imageUrl?: string;
}

interface MemoryQuestion extends BaseQuestion {
  type: 'Memoria';
  images: string[];
  correctImageIndex: number;
}

interface DistractionQuestion extends BaseQuestion {
  type: 'Distracción';
  text: string;
  options: string[];
  correctAnswer: number;
}

interface SequenceQuestion extends BaseQuestion {
  type: 'Secuencia';
  sequence: string[];
}

type Question = TextQuestion | MemoryQuestion | DistractionQuestion | SequenceQuestion;

interface SelectedBlock {
  blockName: BlockType;
  quantity: number;
  timeLimit: number;
}

const blockIcons = {
  AptitudVerbal: BookOpen,
  AptitudNumerica: Calculator,
  AptitudEspacial: Box,
  AptitudMecanica: Wrench,
  AptitudPerceptiva: Eye,
  Memoria: Brain,
  RazonamientoAbstracto: Lightbulb
} as const;

const CustomTestCreator = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<SelectedBlock[]>(
    BLOCK_TYPES.map(type => ({
      blockName: type,
      quantity: 0,
      timeLimit: 15 // tiempo por defecto en minutos
    }))
  );
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const questionsRef = collection(db, 'questions');
      const querySnapshot = await getDocs(questionsRef);
      const questionsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }) as Question[];
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Error al cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (blockName: BlockType, increment: boolean) => {
    setSelectedBlocks(prev => prev.map(block => {
      if (block.blockName === blockName) {
        const newQuantity = increment ? block.quantity + 1 : Math.max(0, block.quantity - 1);
        return { ...block, quantity: newQuantity };
      }
      return block;
    }));
  };

  const handleTimeChange = (blockName: BlockType, newTime: number) => {
    setSelectedBlocks(prev => prev.map(block => {
      if (block.blockName === blockName) {
        return { ...block, timeLimit: Math.max(1, Math.min(60, newTime)) };
      }
      return block;
    }));
  };

  // Type guards
  const isTextQuestion = (question: Question): question is TextQuestion => {
    return ['Texto', 'TextoImagen'].includes(question.type);
  };

  const isMemoryQuestion = (question: Question): question is MemoryQuestion => {
    return question.type === 'Memoria';
  };

  const isSequenceQuestion = (question: Question): question is SequenceQuestion => {
    return question.type === 'Secuencia';
  };

  const isDistractionQuestion = (question: Question): question is DistractionQuestion => {
    return question.type === 'Distracción';
  };

  const createAndStartTest = async () => {
    const activeBlocks = selectedBlocks.filter(block => block.quantity > 0);
    
    if (activeBlocks.length === 0) {
      toast.error('Por favor selecciona al menos un bloque de preguntas');
      return;
    }

    try {
      const selectedQuestions: Question[] = [];
      
      for (const selected of activeBlocks) {
        const blockQuestions = questions.filter(q => q.blockType === selected.blockName && q.isPublic);
        
        if (blockQuestions.length < selected.quantity) {
          toast.error(`No hay suficientes preguntas disponibles en el bloque "${BLOCK_NAMES[selected.blockName]}"`);
          return;
        }

        const shuffled = [...blockQuestions].sort(() => Math.random() - 0.5);
        selectedQuestions.push(...shuffled.slice(0, selected.quantity));
      }

      const tempTest = {
        title: 'Test Personalizado',
        description: 'Test creado con bloques personalizados',
        questions: selectedQuestions.map(q => {
          const baseQuestion = {
            id: q.id,
            type: q.type,
            blockType: q.blockType,
            blockName: q.blockName
          };

          if (isTextQuestion(q)) {
            return {
              ...baseQuestion,
              text: q.text,
              options: q.options,
              correctAnswer: q.correctAnswer,
              imageUrl: q.imageUrl
            };
          } else if (isMemoryQuestion(q)) {
            return {
              ...baseQuestion,
              images: q.images,
              correctImageIndex: q.correctImageIndex
            };
          } else if (isSequenceQuestion(q)) {
            return {
              ...baseQuestion,
              sequence: q.sequence
            };
          } else if (isDistractionQuestion(q)) {
            return {
              ...baseQuestion,
              text: q.text,
              options: q.options,
              correctAnswer: q.correctAnswer
            };
          }

          return baseQuestion;
        }),
        blocks: activeBlocks.map(block => ({
          type: block.blockName,
          count: block.quantity,
          timeLimit: block.timeLimit * 60 // convertir a segundos
        })),
        createdAt: Timestamp.now(),
        type: 'temporary',
        status: 'active',
        isTemporary: true,
        userId: currentUser?.uid,
        timeLimit: activeBlocks.reduce((total, block) => total + block.timeLimit * 60, 0), // tiempo total en segundos
      };

      const testRef = await addDoc(collection(db, 'temporaryTests'), tempTest);
      navigate(`/solve-test/${testRef.id}`);
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Error al crear el test');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#91c26a]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear Test Personalizado</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedBlocks.map((block) => {
          const Icon = blockIcons[block.blockName];
          const availableQuestions = questions.filter(q => q.blockType === block.blockName && q.isPublic).length;
          
          return (
            <div
              key={block.blockName}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-[#f0f7eb] rounded-lg">
                  <Icon className="w-6 h-6 text-[#91c26a]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {BLOCK_NAMES[block.blockName]}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {availableQuestions} preguntas disponibles
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Cantidad de preguntas:</label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleQuantityChange(block.blockName, false)}
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                      disabled={block.quantity === 0}
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{block.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(block.blockName, true)}
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                      disabled={block.quantity >= availableQuestions}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Tiempo límite:</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={block.timeLimit}
                      onChange={(e) => handleTimeChange(block.blockName, parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 text-center border rounded"
                    />
                    <span className="text-sm text-gray-500">min</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-between items-center">
        <div className="text-gray-600">
          <p>Tiempo total: {selectedBlocks.reduce((total, block) => total + (block.quantity > 0 ? block.timeLimit : 0), 0)} minutos</p>
          <p>Preguntas totales: {selectedBlocks.reduce((total, block) => total + block.quantity, 0)}</p>
        </div>
        <button
          onClick={createAndStartTest}
          className="px-6 py-3 bg-[#91c26a] text-white rounded-lg font-medium hover:bg-[#7ea756] transition-colors"
        >
          Crear y Comenzar Test
        </button>
      </div>
    </div>
  );
};

export default CustomTestCreator;

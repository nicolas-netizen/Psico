import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { BlockType } from '../../types/blocks';
import { toast } from 'react-hot-toast';
import BlockPresentation from '../test/BlockPresentation';

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
  id: string;
  type: string;
  name: string;
  description: string;
  defaultQuantity: number;
  questions: Question[];
}

interface GeneratedTest {
  blocks: TestBlock[];
}

const TestGenerator: React.FC = () => {
  const [availableBlocks, setAvailableBlocks] = useState<TestBlock[]>([]);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [testStarted, setTestStarted] = useState(false);
  const [generatedTest, setGeneratedTest] = useState<GeneratedTest | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    setLoading(true);
    try {
      const blocksRef = collection(db, 'testBlocks');
      const snapshot = await getDocs(blocksRef);
      const blocksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TestBlock[];
      setAvailableBlocks(blocksData);
    } catch (error) {
      console.error('Error loading blocks:', error);
      toast.error('Error al cargar los bloques');
    } finally {
      setLoading(false);
    }
  };

  const generateTest = () => {
    if (selectedBlockIds.length === 0) {
      toast.error('Selecciona al menos un bloque');
      return;
    }

    const selectedBlocks = availableBlocks
      .filter(block => selectedBlockIds.includes(block.id))
      .map(block => {
        // Mezclar las preguntas del bloque
        const shuffledQuestions = [...block.questions]
          .sort(() => Math.random() - 0.5)
          .slice(0, block.defaultQuantity);

        return {
          ...block,
          questions: shuffledQuestions
        };
      });

    setGeneratedTest({ blocks: selectedBlocks });
    setTestStarted(true);
  };

  const handleAnswer = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));

    const currentBlockQuestions = generatedTest?.blocks[currentBlock].questions || [];
    if (currentQuestionIndex < currentBlockQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentBlock < (generatedTest?.blocks.length || 0) - 1) {
      setCurrentBlock(prev => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Test completed
      toast.success('¡Test completado!');
      setTestStarted(false);
      console.log('Respuestas:', answers);
    }
  };

  const toggleBlock = (blockId: string) => {
    setSelectedBlockIds(prev => {
      const isSelected = prev.includes(blockId);
      if (isSelected) {
        return prev.filter(id => id !== blockId);
      } else {
        return [...prev, blockId];
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#91c26a]"></div>
        <p className="mt-4 text-gray-600">Cargando bloques...</p>
      </div>
    );
  }

  if (testStarted && generatedTest) {
    const currentBlockData = generatedTest.blocks[currentBlock];
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-blue-800">
                Bloque {currentBlock + 1} de {generatedTest.blocks.length}
              </h2>
              <p className="text-sm text-blue-600">
                Pregunta {currentQuestionIndex + 1} de {currentBlockData.questions.length}
              </p>
            </div>
            <div className="text-sm text-blue-600">
              Progreso total: {Math.round(((currentBlock * 100) + (currentQuestionIndex + 1) * 100 / currentBlockData.questions.length) / generatedTest.blocks.length)}%
            </div>
          </div>
        </div>
        <BlockPresentation
          blockType={currentBlockData.type as BlockType}
          description={currentBlockData.description}
          questions={currentBlockData.questions.map(q => ({
            id: Math.random().toString(),
            type: q.type,
            text: q.question,
            options: q.options
          }))}
          currentQuestionIndex={currentQuestionIndex}
          onAnswer={handleAnswer}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Generador de Tests</h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableBlocks.map(block => (
              <div
                key={block.id}
                className={`p-4 rounded-lg border-2 cursor-pointer ${
                  selectedBlockIds.includes(block.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => toggleBlock(block.id)}
              >
                <h3 className="font-semibold text-lg mb-2">{block.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{block.description}</p>
                <div className="text-sm text-gray-500">
                  Preguntas por defecto: {block.defaultQuantity}
                </div>
              </div>
            ))}
          </div>

          {availableBlocks.length === 0 && (
            <p className="text-center text-gray-500">
              No hay bloques disponibles. Crea algunos bloques primero.
            </p>
          )}

          {availableBlocks.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={generateTest}
                disabled={selectedBlockIds.length === 0}
                className={`px-6 py-2 rounded-lg ${
                  selectedBlockIds.length === 0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Generar Test
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestGenerator;

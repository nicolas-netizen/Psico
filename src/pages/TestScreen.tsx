import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, query, where, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Test, BlockConfig, Question, createTemporaryTest, loadBlockQuestions, updateTestQuestions } from '../firebase/tests';

interface TestSession {
  id?: string;
  testId: string;
  userId: string;
  startedAt: Date;
  currentBlock: number;
  currentQuestion: number;
  answers: any[];
  completed: boolean;
}

const TestScreen = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [session, setSession] = useState<TestSession | null>(null);

  useEffect(() => {
    const initializeTest = async () => {
      try {
        console.log('Initializing test...');
        if (!currentUser) {
          toast.error('Debes iniciar sesión para realizar el test');
          navigate('/login');
          return;
        }

        let currentTest: Test;
        if (testId) {
          console.log('Fetching test:', testId);
          const testDoc = await getDoc(doc(db, 'tests', testId));
          
          if (!testDoc.exists()) {
            toast.error('Test no encontrado');
            navigate('/dashboard');
            return;
          }

          const testData = testDoc.data();
          console.log('Test data:', testData);
          
          if (!testData.isTemporary) {
            console.log('Creating temporary copy of test');
            currentTest = await createTemporaryTest(testId, currentUser.uid);
          } else {
            console.log('Using existing temporary test');
            currentTest = { id: testDoc.id, ...testData } as Test;
          }
        } else {
          console.log('No testId provided, looking for public tests');
          // Buscar tests públicos
          const testsQuery = query(
            collection(db, 'tests'),
            where('isPublic', '==', true),
            where('isTemporary', '==', false)
          );
          const testsSnapshot = await getDocs(testsQuery);
          
          if (testsSnapshot.empty) {
            toast.error('No hay tests disponibles');
            navigate('/dashboard');
            return;
          }

          console.log(`Found ${testsSnapshot.size} public tests`);
          // Seleccionar un test aleatorio y crear una copia temporal
          const templates = testsSnapshot.docs;
          const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
          console.log('Selected random template:', randomTemplate.id);
          currentTest = await createTemporaryTest(randomTemplate.id, currentUser.uid);
        }

        console.log('Setting test state:', currentTest);
        setTest(currentTest);

        // Crear sesión para el test
        const newSession: Omit<TestSession, 'id'> = {
          testId: currentTest.id,
          userId: currentUser.uid,
          startedAt: new Date(),
          currentBlock: 0,
          currentQuestion: 0,
          answers: [],
          completed: false
        };

        console.log('Creating test session:', newSession);
        const sessionRef = await addDoc(collection(db, 'testSessions'), newSession);
        setSession({ id: sessionRef.id, ...newSession });

        // Cargar las preguntas para el primer bloque
        console.log('Loading questions for first block');
        await loadQuestionsForBlock(0, currentTest);
        
        console.log('Test initialization complete');
        setLoading(false);
      } catch (error) {
        console.error('Error initializing test:', error);
        toast.error('Error al inicializar el test');
        navigate('/dashboard');
        setLoading(false);
      }
    };

    initializeTest();
  }, [testId, navigate, currentUser]);

  const loadQuestionsForBlock = async (blockIndex: number, currentTest: Test) => {
    try {
      const block = currentTest.blocks[blockIndex];
      if (!block) {
        console.error('Block not found at index:', blockIndex);
        toast.error('Error: Bloque no encontrado');
        return [];
      }

      console.log('Loading questions for block:', block);

      if (!block.type) {
        console.error('Block type is missing:', block);
        toast.error('Error: Tipo de bloque no definido');
        return [];
      }

      const questions = await loadBlockQuestions(
        block.id || '',
        block.type,
        block.quantity || 1
      );

      console.log(`Loaded ${questions.length} questions for block`);

      if (questions.length === 0) {
        toast.error(`No se encontraron preguntas para el bloque de tipo ${block.type}`);
        return [];
      }

      // Actualizar el test con las preguntas cargadas
      const updatedTest = await updateTestQuestions(
        currentTest.id,
        blockIndex,
        questions
      );

      setTest(updatedTest);
      return questions;
    } catch (error) {
      console.error('Error loading questions for block:', error);
      toast.error('Error al cargar las preguntas del bloque');
      return [];
    }
  };

  const handleBlockComplete = async () => {
    if (!session || !test) return;

    try {
      if (currentBlockIndex < test.blocks.length - 1) {
        const nextBlockIndex = currentBlockIndex + 1;
        await loadQuestionsForBlock(nextBlockIndex, test);
        setCurrentBlockIndex(nextBlockIndex);
        setCurrentQuestionIndex(0);

        // Actualizar sesión
        const sessionRef = doc(db, 'testSessions', session.id);
        await updateDoc(sessionRef, {
          currentBlock: nextBlockIndex,
          currentQuestion: 0
        });
      } else {
        // Test completado
        const sessionRef = doc(db, 'testSessions', session.id);
        await updateDoc(sessionRef, {
          completed: true,
          completedAt: new Date()
        });

        // Eliminar el test temporal
        if (test.isTemporary) {
          await deleteDoc(doc(db, 'tests', test.id));
        }

        navigate(`/results/${session.id}`);
      }
    } catch (error) {
      console.error('Error completing block:', error);
      toast.error('Error al completar el bloque');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  if (!test || !session) {
    return null;
  }

  const currentBlock = test.blocks[currentBlockIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
          <p className="mt-2 text-gray-600">{test.description}</p>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">
              Bloque {currentBlockIndex + 1} de {test.blocks.length}
            </span>
            <span className="text-sm text-gray-500">
              Pregunta {currentQuestionIndex + 1} de {currentBlock.quantity}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-[#91c26a] h-2 rounded-full"
              style={{
                width: `${((currentBlockIndex * currentBlock.quantity + currentQuestionIndex + 1) /
                  (test.blocks.reduce((acc, block) => acc + block.quantity, 0))) *
                  100}%`
              }}
            />
          </div>
        </div>

        {/* Renderizar el componente específico según el tipo de bloque */}
        <div className="mt-6">
          {currentBlock.questions && currentBlock.questions.length > 0 ? (
            <div>
              {currentBlock.type === 'Memoria' && (
                <div>
                  {/* Componente de Memoria */}
                  <p>Componente de Memoria</p>
                </div>
              )}
              {currentBlock.type === 'Texto' && (
                <div>
                  {/* Componente de Texto */}
                  <p>Componente de Texto</p>
                </div>
              )}
              {currentBlock.type === 'Distracción' && (
                <div>
                  {/* Componente de Distracción */}
                  <p>Componente de Distracción</p>
                </div>
              )}
              {currentBlock.type === 'Secuencia' && (
                <div>
                  {/* Componente de Secuencia */}
                  <p>Componente de Secuencia</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600">Cargando preguntas...</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleBlockComplete}
            className="px-4 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b] transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestScreen;

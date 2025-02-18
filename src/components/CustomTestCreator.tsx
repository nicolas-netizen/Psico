import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Minus } from 'lucide-react';

interface Question {
  id: string;
  blockName: string;
  text: string;
  type: string;
  options?: string[];
  correctAnswer?: number;
}

interface SelectedBlock {
  blockName: string;
  quantity: number;
}

const CustomTestCreator = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<SelectedBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const questionsRef = collection(db, 'questions');
      const querySnapshot = await getDocs(questionsRef);
      const questionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Question[];
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Error al cargar las preguntas');
    }
  };

  const blockNames = [...new Set(questions.filter(q => q.blockName).map(q => q.blockName))];

  const handleBlockSelection = (blockName: string, quantity: number) => {
    setSelectedBlocks(prev => {
      const existing = prev.find(b => b.blockName === blockName);
      if (existing) {
        if (quantity === 0) {
          return prev.filter(b => b.blockName !== blockName);
        }
        return prev.map(b => 
          b.blockName === blockName ? { ...b, quantity } : b
        );
      }
      if (quantity > 0) {
        return [...prev, { blockName, quantity }];
      }
      return prev;
    });
  };

  const createAndStartTest = async () => {
    if (selectedBlocks.length === 0) {
      toast.error('Selecciona al menos un bloque de preguntas');
      return;
    }

    setLoading(true);
    try {
      // Recopilar preguntas seleccionadas de cada bloque
      const selectedQuestions: Question[] = [];
      
      for (const selected of selectedBlocks) {
        const blockQuestions = questions.filter(q => q.blockName === selected.blockName);
        const shuffled = [...blockQuestions].sort(() => 0.5 - Math.random());
        const selectedFromBlock = shuffled.slice(0, selected.quantity);
        selectedQuestions.push(...selectedFromBlock);
      }

      // Crear test temporal
      const tempTest = {
        title: 'Test Personalizado',
        description: 'Test creado con bloques personalizados',
        questions: selectedQuestions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer
        })),
        createdAt: Timestamp.now(),
        type: 'temporary',
        status: 'active',
        isTemporary: true
      };

      // Guardar test temporal
      const testRef = await addDoc(collection(db, 'temporaryTests'), {
        ...tempTest,
        userId: currentUser?.uid // Asegurarnos de que el userId esté establecido
      });
      
      // Redirigir al usuario para resolver el test
      navigate(`/solve-test/${testRef.id}`, { 
        state: { 
          isTemporary: true,
          selectedBlocks: selectedBlocks.map(b => b.blockName).join(', ')
        } 
      });
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Error al crear el test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Crear Test Personalizado</h2>
          <p className="text-gray-600 mt-2">
            Selecciona los bloques de preguntas que deseas practicar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {blockNames.map((blockName) => {
          const blockQuestions = questions.filter(q => q.blockName === blockName);
          const selected = selectedBlocks.find(b => b.blockName === blockName);
          
          return (
            <div key={blockName} 
                 className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-3">{blockName}</h3>
              
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {blockQuestions.length} preguntas disponibles
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleBlockSelection(blockName, Math.max(0, (selected?.quantity || 0) - 1))}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                    disabled={!selected?.quantity}
                  >
                    <Minus size={20} />
                  </button>

                  <input
                    type="number"
                    min="0"
                    max={blockQuestions.length}
                    value={selected?.quantity || 0}
                    onChange={(e) => handleBlockSelection(blockName, parseInt(e.target.value))}
                    className="w-16 p-2 text-center border rounded-md"
                  />

                  <button
                    onClick={() => handleBlockSelection(blockName, Math.min(blockQuestions.length, (selected?.quantity || 0) + 1))}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                    disabled={selected?.quantity === blockQuestions.length}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {blockNames.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            No hay bloques de preguntas disponibles.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            El administrador debe crear preguntas y asignarlas a bloques.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={createAndStartTest}
          disabled={loading || selectedBlocks.length === 0}
          className="px-8 py-3 bg-[#91c26a] text-white rounded-lg font-semibold 
                   hover:bg-[#82b35b] transition-colors disabled:opacity-50 
                   disabled:cursor-not-allowed flex items-center space-x-2
                   shadow-sm hover:shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Creando test...</span>
            </>
          ) : (
            <span>Comenzar Test</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default CustomTestCreator;

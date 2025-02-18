import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Minus, BookOpen, CheckCircle } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedTime, setSelectedTime] = useState(30); // tiempo en minutos

  const timeOptions = [
    { value: 15, label: '15 minutos' },
    { value: 30, label: '30 minutos' },
    { value: 45, label: '45 minutos' },
    { value: 60, label: 'Una hora' },
    { value: 90, label: 'Hora y media' },
    { value: 120, label: 'Dos horas' },
  ];

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
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
      setError('Error al cargar las preguntas. Por favor, intenta de nuevo.');
      toast.error('Error al cargar las preguntas');
    } finally {
      setLoading(false);
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

  const getTotalQuestions = () => {
    return selectedBlocks.reduce((total, block) => total + block.quantity, 0);
  };

  // Función para mezclar array usando Fisher-Yates
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const createAndStartTest = async () => {
    if (selectedBlocks.length === 0) {
      toast.error('Selecciona al menos un bloque de preguntas');
      return;
    }

    setLoading(true);
    try {
      const selectedQuestions: Question[] = [];
      
      for (const selected of selectedBlocks) {
        const blockQuestions = questions.filter(q => q.blockName === selected.blockName);
        
        if (blockQuestions.length < selected.quantity) {
          toast.error(`No hay suficientes preguntas disponibles en el bloque "${selected.blockName}"`);
          return;
        }

        const shuffled = shuffleArray(blockQuestions);
        const selectedFromBlock = shuffled.slice(0, selected.quantity);
        selectedQuestions.push(...selectedFromBlock);
      }

      // Mezclar también el orden final de las preguntas
      const finalQuestions = shuffleArray(selectedQuestions);

      if (finalQuestions.length === 0) {
        throw new Error('No se encontraron preguntas para los bloques seleccionados');
      }

      const tempTest = {
        title: 'Test Personalizado',
        description: 'Test creado con bloques personalizados',
        questions: finalQuestions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          blockName: q.blockName // Añadimos el nombre del bloque para la revisión
        })),
        createdAt: Timestamp.now(),
        type: 'temporary',
        status: 'active',
        isTemporary: true,
        userId: currentUser?.uid,
        timeLimit: selectedTime * 60, // convertir a segundos
      };

      const testRef = await addDoc(collection(db, 'temporaryTests'), tempTest);
      
      navigate(`/solve-test/${testRef.id}`, { 
        state: { 
          isTemporary: true,
          selectedBlocks: selectedBlocks.map(b => b.blockName).join(', ')
        } 
      });
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Error al crear el test: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-[#91c26a]" />
        <p className="mt-4 text-gray-600">Cargando preguntas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadQuestions}
            className="px-4 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b] transition-all"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Crear Test Personalizado</h1>
              <p className="text-gray-600">
                Selecciona los bloques de preguntas y el tiempo límite para tu test
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#91c26a]">{getTotalQuestions()}</div>
              <div className="text-sm text-gray-500">Preguntas seleccionadas</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tiempo del Test</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {timeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedTime(option.value)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    selectedTime === option.value
                      ? 'bg-[#91c26a] text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {blockNames.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blockNames.map((blockName) => {
                const blockQuestions = questions.filter(q => q.blockName === blockName);
                const selected = selectedBlocks.find(b => b.blockName === blockName);
                const isSelected = selected && selected.quantity > 0;
                
                return (
                  <div 
                    key={blockName} 
                    className={`relative bg-white rounded-lg border-2 transition-all duration-200 ${
                      isSelected ? 'border-[#91c26a] shadow-md' : 'border-gray-100 hover:border-gray-200'
                    } p-6`}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle className="w-5 h-5 text-[#91c26a]" />
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-[#91c26a] bg-opacity-10 rounded-lg p-3">
                        <BookOpen className="w-6 h-6 text-[#91c26a]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{blockName}</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          {blockQuestions.length} preguntas disponibles
                        </p>
                        
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleBlockSelection(blockName, Math.max(0, (selected?.quantity || 0) - 1))}
                            className={`p-2 rounded-lg transition-colors ${
                              !selected?.quantity 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            disabled={!selected?.quantity}
                          >
                            <Minus size={20} />
                          </button>

                          <input
                            type="number"
                            min="0"
                            max={blockQuestions.length}
                            value={selected?.quantity || 0}
                            onChange={(e) => handleBlockSelection(blockName, parseInt(e.target.value) || 0)}
                            className="w-16 p-2 text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
                          />

                          <button
                            onClick={() => handleBlockSelection(blockName, Math.min(blockQuestions.length, (selected?.quantity || 0) + 1))}
                            className={`p-2 rounded-lg transition-colors ${
                              selected?.quantity === blockQuestions.length 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            disabled={selected?.quantity === blockQuestions.length}
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">
                No hay bloques de preguntas disponibles
              </p>
              <p className="text-gray-500 text-sm mt-2">
                El administrador debe crear preguntas y asignarlas a bloques
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={createAndStartTest}
            disabled={loading || selectedBlocks.length === 0}
            className="px-8 py-3 bg-[#91c26a] text-white rounded-lg font-semibold 
                     hover:bg-[#82b35b] transition-all disabled:opacity-50 
                     disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin mr-2" size={20} />
                Creando test...
              </span>
            ) : (
              'Crear y Comenzar Test'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomTestCreator;

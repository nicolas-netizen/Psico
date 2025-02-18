import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface TestBlock {
  id: string;
  type: string;
  name: string;
  description: string;
  defaultQuantity: number;
  questions: any[];
}

interface CustomTestBlock extends TestBlock {
  quantity: number;
  selected: boolean;
}

interface CustomTestBuilderProps {
  onBack?: () => void;
}

const CustomTestBuilder: React.FC<CustomTestBuilderProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [availableBlocks, setAvailableBlocks] = useState<CustomTestBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [testName, setTestName] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);

  useEffect(() => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para crear tests personalizados');
      navigate('/login');
      return;
    }
    loadTestBlocks();
  }, [currentUser, navigate]);

  const loadTestBlocks = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      console.log('Loading test blocks...');
      
      const blocksRef = collection(db, 'testBlocks');
      console.log('Collection reference created');
      
      // Try without the isActive filter first
      const snapshot = await getDocs(blocksRef);
      console.log('Got snapshot, empty?', snapshot.empty);
      
      if (snapshot.empty) {
        console.log('No test blocks found');
        toast.error('No hay bloques de test disponibles');
        return;
      }

      const blocks = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Block data:', data);
        return {
          id: doc.id,
          ...data,
          quantity: data.defaultQuantity || 1,
          selected: false
        };
      }) as CustomTestBlock[];
      
      console.log('Processed blocks:', blocks);
      setAvailableBlocks(blocks);
      toast.success('Bloques cargados exitosamente');
    } catch (error) {
      console.error('Error loading test blocks:', error);
      toast.error('Error al cargar los bloques de test. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockSelection = (blockId: string) => {
    setAvailableBlocks(blocks =>
      blocks.map(block =>
        block.id === blockId
          ? { ...block, selected: !block.selected }
          : block
      )
    );
  };

  const handleQuantityChange = (blockId: string, value: number) => {
    setAvailableBlocks(blocks =>
      blocks.map(block =>
        block.id === blockId
          ? { ...block, quantity: Math.max(1, value) }
          : block
      )
    );
  };

  const handleCreateTest = async () => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para crear tests');
      return;
    }

    if (!testName.trim()) {
      toast.error('El nombre del test es requerido');
      return;
    }

    const selectedBlocks = availableBlocks.filter(block => block.selected);
    if (selectedBlocks.length === 0) {
      toast.error('Debes seleccionar al menos un bloque');
      return;
    }

    try {
      const customTestRef = collection(db, 'customTests');
      await addDoc(customTestRef, {
        name: testName,
        description: testDescription,
        timeLimit,
        userId: currentUser.uid,
        createdAt: new Date(),
        blocks: selectedBlocks.map(block => ({
          blockId: block.id,
          quantity: block.quantity
        })),
        isActive: true
      });

      toast.success('Test personalizado creado exitosamente');
      if (onBack) {
        onBack();
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error creating custom test:', error);
      toast.error('Error al crear el test personalizado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Crear Test Personalizado</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="testName" className="block text-sm font-medium text-gray-700">
                Nombre del Test
              </label>
              <input
                type="text"
                id="testName"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                placeholder="Ingresa el nombre del test"
              />
            </div>

            <div>
              <label htmlFor="testDescription" className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                id="testDescription"
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                placeholder="Describe el propósito del test"
              />
            </div>

            <div>
              <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700">
                Tiempo Límite (minutos)
              </label>
              <input
                type="number"
                id="timeLimit"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Math.max(1, parseInt(e.target.value) || 1))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                min="1"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bloques Disponibles</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {availableBlocks.map((block) => (
              <div
                key={block.id}
                className={`p-4 rounded-lg border ${
                  block.selected ? 'border-[#91c26a] bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={block.selected}
                    onChange={() => handleBlockSelection(block.id)}
                    className="mt-1 h-4 w-4 text-[#91c26a] focus:ring-[#91c26a] border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">{block.name}</h4>
                    <p className="text-sm text-gray-500">{block.description}</p>
                    {block.selected && (
                      <div className="mt-2">
                        <label className="text-sm text-gray-700">
                          Cantidad de preguntas:
                          <input
                            type="number"
                            value={block.quantity}
                            onChange={(e) =>
                              handleQuantityChange(block.id, parseInt(e.target.value) || 1)
                            }
                            className="ml-2 w-20 rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                            min="1"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#91c26a]"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateTest}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#91c26a] hover:bg-[#82b35b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#91c26a]"
          >
            Crear Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomTestBuilder;

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-hot-toast';

interface TestBlock {
  id: string;
  type: string;
  name: string;
  description: string;
  defaultQuantity: number;
}

interface CustomTestBlock extends TestBlock {
  quantity: number;
  selected: boolean;
}

const CustomTestBuilder: React.FC = () => {
  const [availableBlocks, setAvailableBlocks] = useState<CustomTestBlock[]>([]);
  const [testName, setTestName] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    loadTestBlocks();
  }, []);

  const loadTestBlocks = async () => {
    try {
      const blocksRef = collection(db, 'testBlocks');
      const snapshot = await getDocs(blocksRef);
      const blocks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        quantity: doc.data().defaultQuantity || 1,
        selected: false
      })) as CustomTestBlock[];
      setAvailableBlocks(blocks);
    } catch (error) {
      console.error('Error loading test blocks:', error);
      toast.error('Error al cargar los bloques de test');
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

  const handleQuantityChange = (blockId: string, quantity: number) => {
    setAvailableBlocks(blocks =>
      blocks.map(block =>
        block.id === blockId
          ? { ...block, quantity: Math.max(1, quantity) }
          : block
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBlocks = availableBlocks.filter(block => block.selected);
    
    if (selectedBlocks.length === 0) {
      toast.error('Selecciona al menos un bloque para el test');
      return;
    }

    // Here you would implement the logic to save the custom test
    console.log({
      name: testName,
      description: testDescription,
      timeLimit,
      isPublic,
      blocks: selectedBlocks
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Crear Test Personalizado</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre del Test
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Descripción
            <textarea
              value={testDescription}
              onChange={(e) => setTestDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={3}
              required
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tiempo Límite (minutos)
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              min="1"
              required
            />
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Test Público</span>
          </label>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Bloques Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableBlocks.map(block => (
              <div
                key={block.id}
                className={`p-4 border rounded-lg ${
                  block.selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={block.selected}
                      onChange={() => handleBlockSelection(block.id)}
                      className="rounded border-gray-300 text-indigo-600"
                    />
                    <span className="font-medium">{block.name}</span>
                  </label>
                  {block.selected && (
                    <input
                      type="number"
                      value={block.quantity}
                      onChange={(e) => handleQuantityChange(block.id, parseInt(e.target.value))}
                      className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      min="1"
                    />
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600">{block.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Crear Test
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomTestBuilder;

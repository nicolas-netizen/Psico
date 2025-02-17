import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

interface TestBlock {
  id: string;
  type: string;
  name: string;
  description: string;
  defaultQuantity: number;
  isActive: boolean;
  questions: any[];
}

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [testName, setTestName] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [blocks, setBlocks] = useState<TestBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTestBlocks();
  }, []);

  const fetchTestBlocks = async () => {
    try {
      setLoading(true);
      const blocksRef = collection(db, 'testBlocks');
      const q = query(blocksRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      const fetchedBlocks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TestBlock[];

      console.log('Fetched blocks:', fetchedBlocks);
      setBlocks(fetchedBlocks);
      setError('');
    } catch (err) {
      console.error('Error fetching test blocks:', err);
      setError('Error al cargar los bloques de test');
      toast.error('Error al cargar los bloques de test');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for creating test...
  };

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold mb-6">Crear Test Personalizado</h2>
          
          <form onSubmit={handleCreateTest} className="space-y-6">
            <div>
              <label htmlFor="testName" className="block text-sm font-medium text-gray-700">
                Nombre del Test
              </label>
              <input
                type="text"
                id="testName"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Ingresa el nombre del test"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el propósito del test"
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                required
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
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                required
              />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bloques Disponibles</h3>
              {loading ? (
                <p className="text-gray-500">Cargando bloques...</p>
              ) : error ? (
                <div className="text-red-600">{error}</div>
              ) : blocks.length === 0 ? (
                <p className="text-gray-500">No hay bloques de test disponibles</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-[#91c26a] focus-within:ring-2 focus-within:ring-[#91c26a] focus-within:ring-offset-2"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{block.name}</p>
                          <p className="text-sm text-gray-500 truncate">{block.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#91c26a]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#91c26a] hover:bg-[#82b35b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#91c26a]"
              >
                Crear Test
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

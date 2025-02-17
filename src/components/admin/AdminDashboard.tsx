import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import TestsManager from './TestsManager';
import BlockManager from './BlockManager';
import PlanManager from './PlanManager';
import DiscountCodeManager from './DiscountCodeManager';
import BaremoAdmin from '../../pages/admin/BaremoAdmin';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState(0);
  const [initializing, setInitializing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const tabs = [
    { name: 'Gestión de Tests', component: <TestsManager /> },
    { name: 'Gestión de Bloques', component: <BlockManager /> },
    { name: 'Gestión de Planes', component: <PlanManager /> },
    { name: 'Gestión de Baremo', component: <BaremoAdmin /> },
    { name: 'Códigos de Descuento', component: <DiscountCodeManager /> }
  ];

  useEffect(() => {
    checkAdminStatus();
  }, [currentUser]);

  const checkAdminStatus = async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      setIsAdmin(userDoc.data()?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleInitialize = async () => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para realizar esta acción');
      return;
    }

    try {
      setInitializing(true);
      
      // Set admin role
      await setDoc(doc(db, 'users', currentUser.uid), {
        role: 'admin',
        email: currentUser.email,
        updatedAt: new Date()
      }, { merge: true });

      // Initialize test blocks
      const blocks = [
        {
          type: 'memory',
          name: 'Memoria Visual',
          description: 'Evalúa la capacidad de recordar y reconocer patrones visuales',
          defaultQuantity: 5,
          isActive: true,
          questions: [
            {
              type: 'multiple_choice',
              question: '¿Qué imagen estaba en la posición central?',
              options: ['Círculo rojo', 'Cuadrado azul', 'Triángulo verde', 'Estrella amarilla'],
              correctAnswer: 2
            }
          ]
        },
        {
          type: 'attention',
          name: 'Atención Selectiva',
          description: 'Evalúa la capacidad de mantener el foco en estímulos específicos',
          defaultQuantity: 4,
          isActive: true,
          questions: [
            {
              type: 'multiple_choice',
              question: 'Identifica el elemento diferente en la secuencia',
              options: ['Patrón A', 'Patrón B', 'Patrón C', 'Patrón D'],
              correctAnswer: 1
            }
          ]
        }
      ];

      const blocksRef = collection(db, 'testBlocks');
      
      // Check existing blocks
      const existingBlocks = await getDocs(blocksRef);
      console.log('Existing blocks:', existingBlocks.size);

      // Add blocks directly to the collection
      for (const block of blocks) {
        await setDoc(doc(blocksRef), block);
      }
      
      setIsAdmin(true);
      toast.success('Inicialización completada exitosamente');
      
      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error in initialization:', error);
      toast.error('Error en la inicialización');
    } finally {
      setInitializing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Panel de Administración</h1>
          <button
            onClick={handleInitialize}
            disabled={initializing}
            className={`px-4 py-2 rounded-md text-white ${
              initializing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#91c26a] hover:bg-[#82b35b]'
            }`}
          >
            {initializing ? 'Inicializando...' : 'Inicializar Sistema'}
          </button>
        </div>

        {isAdmin ? (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.name}
                    onClick={() => setSelectedTab(index)}
                    className={`${
                      selectedTab === index
                        ? 'border-[#91c26a] text-[#91c26a]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {tabs[selectedTab].component}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Necesitas permisos de administrador. Haz clic en "Inicializar Sistema" para comenzar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
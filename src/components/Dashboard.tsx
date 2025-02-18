import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Brain, Clock, Trophy, ChevronRight, Plus, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';

interface Plan {
  name: string;
  duration: number;
  startDate: any;
  customTestsEnabled?: boolean;
}

interface User {
  plan?: string;
  planStartDate?: any;
}

interface Test {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  isPublic: boolean;
  customSettings?: {
    imagesPerBlock: number;
    blocks: number;
    memorizeTime: number;
    distractionTime: number;
  };
  type?: string;
  userId?: string;
  createdAt?: any;
}

interface TestResult {
  id: string;
  testId: string;
  userId: string;
  score: number;
  completedAt: any;
  testTitle: string;
}

interface BlockConfig {
  type: 'Texto' | 'Memoria' | 'Distracción' | 'Secuencia';
  quantity: number;
}

const COLORS = ['#91c26a', '#fbbf24', '#ef4444'];

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [userPlan, setUserPlan] = useState<{
    name: string;
    expiresAt: any;
    purchasedAt: any;
    customTestsEnabled?: boolean;
  } | null>(null);
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [userResults, setUserResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customTest, setCustomTest] = useState({
    title: '',
    description: '',
    timeLimit: 30,
    blocks: [] as BlockConfig[],
    memorizeTime: 30,
    distractionTime: 15,
    isPublic: false
  });

  const [newBlock, setNewBlock] = useState({
    type: 'Memoria' as BlockConfig['type'],
    quantity: 1
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!currentUser) {
          toast.error('Debes iniciar sesión para ver el dashboard');
          navigate('/login');
          return;
        }

        // Verificar el plan del usuario
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.planId) {
            // Obtener los detalles del plan
            const planDoc = await getDoc(doc(db, 'plans', userData.planId));
            const planData = planDoc.data();
            
            setUserPlan({
              name: userData.planName,
              expiresAt: userData.planExpiresAt,
              purchasedAt: userData.planPurchasedAt,
              customTestsEnabled: planData?.customTestsEnabled || false
            });

            // Calcular días restantes
            if (userData.planExpiresAt) {
              const expiresAt = userData.planExpiresAt.toDate();
              const now = new Date();
              const diffTime = expiresAt.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              setDaysLeft(diffDays);
            }

            // Cargar tests disponibles
            const testsQuery = query(
              collection(db, 'tests'),
              where('isPublic', '==', true)
            );
            const testsSnapshot = await getDocs(testsQuery);
            const testsData = testsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Test[];
            setAvailableTests(testsData);
          }
        }

        // Cargar resultados del usuario
        const resultsQuery = query(
          collection(db, 'testResults'),
          where('userId', '==', currentUser.uid),
          orderBy('completedAt', 'desc')
        );
        const resultsSnapshot = await getDocs(resultsQuery);
        const resultsData = resultsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TestResult[];
        setUserResults(resultsData);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  const handleCreateCustomTest = () => {
    if (!userPlan?.customTestsEnabled) {
      toast.error('Tu plan actual no incluye la creación de tests personalizados. Actualiza tu plan para acceder a esta función.');
      navigate('/plans');
      return;
    }
    setShowCustomizeModal(true);
  };

  const handleStartTest = (testId: string) => {
    navigate(`/test/${testId}`);
  };

  const handleStartRandomTest = () => {
    navigate('/test');
  };

  const addBlock = () => {
    setCustomTest(prev => ({
      ...prev,
      blocks: [...prev.blocks, { ...newBlock }]
    }));
    setNewBlock({ type: 'Memoria', quantity: 1 });
  };

  const removeBlock = (index: number) => {
    setCustomTest(prev => ({
      ...prev,
      blocks: prev.blocks.filter((_, i) => i !== index)
    }));
  };

  const handleCreateCustomTestSubmit = async () => {
    try {
      if (customTest.blocks.length === 0) {
        toast.error('Debes agregar al menos un bloque al test');
        return;
      }

      if (!customTest.title.trim()) {
        toast.error('El test debe tener un título');
        return;
      }

      const newTest = {
        ...customTest,
        createdBy: currentUser!.uid,
        createdAt: new Date(),
        type: 'custom',
        userId: currentUser!.uid
      };

      const testRef = await addDoc(collection(db, 'tests'), newTest);
      toast.success('Test creado exitosamente');
      setShowCustomizeModal(false);
      setCustomTest({
        title: '',
        description: '',
        timeLimit: 30,
        blocks: [],
        memorizeTime: 30,
        distractionTime: 15,
        isPublic: false
      });

      // Actualizar la lista de tests disponibles
      setAvailableTests(prev => [...prev, { id: testRef.id, ...newTest }]);
    } catch (error) {
      console.error('Error creating custom test:', error);
      toast.error('Error al crear el test personalizado');
    }
  };

  // Preparar datos para los gráficos
  const progressData = userResults.slice(0, 10).reverse().map(result => ({
    name: new Date(result.completedAt.toDate()).toLocaleDateString(),
    score: result.score
  }));

  const performanceData = [
    { name: 'Excelente', value: userResults.filter(r => r.score >= 70).length },
    { name: 'Regular', value: userResults.filter(r => r.score >= 50 && r.score < 70).length },
    { name: 'Necesita Mejorar', value: userResults.filter(r => r.score < 50).length }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenido, {currentUser?.email}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Aquí puedes ver tus estadísticas, tests disponibles y crear tests personalizados.
          </p>
        </div>

        {userPlan && (
          <div className="mt-4 md:mt-0 bg-white rounded-lg shadow-sm p-4 flex items-center space-x-4">
            <div className="bg-[#91c26a] bg-opacity-10 p-2 rounded-full">
              <Calendar className="h-6 w-6 text-[#91c26a]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{userPlan.name}</p>
              <p className="text-xs text-gray-500">
                {daysLeft} días restantes
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleCreateCustomTest}
            className={`flex items-center px-6 py-3 ${userPlan?.customTestsEnabled 
              ? 'bg-[#91c26a] text-white hover:bg-[#82b35b]' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            <Plus className="h-5 w-5 mr-2" />
            <span>Crear Test Personalizado</span>
          </button>
          
          <button
            onClick={() => navigate('/test/random')}
            className="flex items-center px-6 py-3 border border-[#91c26a] text-[#91c26a] 
                     rounded-lg hover:bg-[#91c26a] hover:text-white transition-colors
                     shadow-sm hover:shadow-md"
          >
            <Brain className="h-5 w-5 mr-2" />
            <span>Test Aleatorio</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-[#91c26a] bg-opacity-10 p-3 rounded-full">
              <Trophy className="h-6 w-6 text-[#91c26a]" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Puntuación Media</p>
              <p className="text-2xl font-semibold text-gray-900">85%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-[#91c26a] bg-opacity-10 p-3 rounded-full">
              <Brain className="h-6 w-6 text-[#91c26a]" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tests Completados</p>
              <p className="text-2xl font-semibold text-gray-900">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-[#91c26a] bg-opacity-10 p-3 rounded-full">
              <Clock className="h-6 w-6 text-[#91c26a]" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tiempo de Estudio</p>
              <p className="text-2xl font-semibold text-gray-900">8h 30m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Progreso Reciente
          </h3>
          <div className="h-64 w-full bg-gradient-to-b from-[#91c26a20] to-transparent rounded-lg p-4">
            {/* Gráfico de ejemplo */}
            <div className="relative h-full">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200" />
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200" />
              
              {/* Línea de progreso */}
              <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  d="M0,50 L20,45 L40,60 L60,30 L80,40 L100,20"
                  fill="none"
                  stroke="#91c26a"
                  strokeWidth="2"
                />
              </svg>
              
              {/* Puntos de datos */}
              <div className="absolute bottom-[45%] left-[20%] w-2 h-2 bg-[#91c26a] rounded-full" />
              <div className="absolute bottom-[60%] left-[40%] w-2 h-2 bg-[#91c26a] rounded-full" />
              <div className="absolute bottom-[30%] left-[60%] w-2 h-2 bg-[#91c26a] rounded-full" />
              <div className="absolute bottom-[40%] left-[80%] w-2 h-2 bg-[#91c26a] rounded-full" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución de Rendimiento
          </h3>
          <div className="h-64 flex items-center justify-center">
            {/* Gráfico circular de ejemplo */}
            <div className="relative w-48 h-48">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#eee"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#91c26a"
                  strokeWidth="10"
                  strokeDasharray="220"
                  strokeDashoffset="66"
                  transform="rotate(-90 50 50)"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="10"
                  strokeDasharray="220"
                  strokeDashoffset="176"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              {/* Leyenda */}
              <div className="absolute -bottom-16 left-0 right-0">
                <div className="flex justify-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#91c26a] rounded-full mr-1"></div>
                    <span>Excelente (70%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#fbbf24] rounded-full mr-1"></div>
                    <span>Regular (30%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Information */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Tu Plan Actual</h3>
          <button
            onClick={() => navigate('/plans')}
            className="text-[#91c26a] hover:text-[#82b35b] font-medium text-sm"
          >
            Ver planes disponibles
          </button>
        </div>

        {userPlan ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xl font-bold text-gray-900">{userPlan.name}</h4>
                <p className="text-gray-600 mt-1">
                  {daysLeft} días restantes
                </p>
              </div>
              <div className="bg-[#f1f7ed] text-[#91c26a] px-3 py-1 rounded-full text-sm font-medium">
                Activo
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#91c26a] h-2 rounded-full"
                style={{
                  width: `${Math.min(100, (daysLeft / 30) * 100)}%`
                }}
              ></div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">
              No tienes ningún plan activo.
            </p>
            <button
              onClick={() => navigate('/plans')}
              className="mt-4 px-6 py-2 bg-[#91c26a] text-white rounded-lg 
                       hover:bg-[#82b35b] transition-colors"
            >
              Ver planes disponibles
            </button>
          </div>
        )}
      </div>

      {/* Recent Tests Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Tests Recientes</h3>
          <button
            onClick={() => navigate('/tests')}
            className="text-sm text-[#91c26a] hover:text-[#82b35b] font-medium"
          >
            Ver todos
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Test cards would go here */}
        </div>
      </div>

      {/* Tests Disponibles */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Tests Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableTests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{test.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{test.description}</p>
                </div>
                {test.customSettings ? (
                  <Settings className="w-6 h-6 text-[#91c26a]" />
                ) : (
                  <Brain className="w-6 h-6 text-[#91c26a]" />
                )}
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                <span>{test.timeLimit} minutos</span>
              </div>
              {test.customSettings && (
                <div className="mt-2 text-sm text-gray-500">
                  <div>Bloques: {test.customSettings.blocks}</div>
                  <div>Imágenes por bloque: {test.customSettings.imagesPerBlock}</div>
                </div>
              )}
              <button
                onClick={() => handleStartTest(test.id)}
                className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-[#91c26a] text-[#91c26a] rounded-lg hover:bg-[#f0f7eb] transition-colors"
              >
                Comenzar Test
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Personalización */}
      {showCustomizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">Crear Test Personalizado</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Título</label>
                <input
                  type="text"
                  value={customTest.title}
                  onChange={(e) => setCustomTest({...customTest, title: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                  placeholder="Nombre del test"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={customTest.description}
                  onChange={(e) => setCustomTest({...customTest, description: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                  placeholder="Describe el propósito del test"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tiempo Límite Total (min)</label>
                  <input
                    type="number"
                    value={customTest.timeLimit}
                    onChange={(e) => setCustomTest({...customTest, timeLimit: Number(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tiempo Memorización (seg)</label>
                  <input
                    type="number"
                    value={customTest.memorizeTime}
                    onChange={(e) => setCustomTest({...customTest, memorizeTime: Number(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                    min="5"
                  />
                </div>
              </div>

              {/* Configuración de Bloques */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Bloques de Preguntas</h3>
                <div className="space-y-4">
                  {customTest.blocks.map((block, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium">{block.type}</span>
                        <span className="ml-2 text-gray-500">({block.quantity} preguntas)</span>
                      </div>
                      <button
                        onClick={() => removeBlock(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Tipo de Pregunta</label>
                      <select
                        value={newBlock.type}
                        onChange={(e) => setNewBlock({
                          ...newBlock,
                          type: e.target.value as BlockConfig['type']
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                      >
                        <option value="Memoria">Memoria</option>
                        <option value="Texto">Texto</option>
                        <option value="Distracción">Distracción</option>
                        <option value="Secuencia">Secuencia</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                      <input
                        type="number"
                        value={newBlock.quantity}
                        onChange={(e) => setNewBlock({
                          ...newBlock,
                          quantity: Math.max(1, Number(e.target.value))
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                        min="1"
                      />
                    </div>
                    <button
                      onClick={addBlock}
                      className="px-4 py-2 bg-[#91c26a] text-white rounded-md hover:bg-[#82b35b]"
                    >
                      Agregar Bloque
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCustomTestSubmit}
                className="px-4 py-2 bg-[#91c26a] text-white rounded-md hover:bg-[#82b35b]"
              >
                Crear Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

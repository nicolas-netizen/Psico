import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Brain, Clock, Trophy, ChevronRight, Settings, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

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
        if (!userDoc.exists()) {
          console.log('Usuario no encontrado en Firestore');
        }

        // Obtener tests públicos y personalizados del usuario
        const testsQuery = query(
          collection(db, 'tests'),
          where('isPublic', '==', true)
        );
        const userTestsQuery = query(
          collection(db, 'tests'),
          where('createdBy', '==', currentUser.uid)
        );

        const [publicTestsSnapshot, userTestsSnapshot] = await Promise.all([
          getDocs(testsQuery),
          getDocs(userTestsQuery)
        ]);

        console.log('Tests públicos encontrados:', publicTestsSnapshot.size);
        console.log('Tests del usuario encontrados:', userTestsSnapshot.size);

        const tests = [
          ...publicTestsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isPublic: true
          })),
          ...userTestsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isPublic: false
          }))
        ] as Test[];

        setAvailableTests(tests);

        // Obtener resultados del usuario
        const resultsQuery = query(
          collection(db, 'testResults'),
          where('userId', '==', currentUser.uid),
          orderBy('completedAt', 'desc')
        );
        
        const resultsSnapshot = await getDocs(resultsQuery);
        console.log('Resultados encontrados:', resultsSnapshot.size);

        const results = await Promise.all(
          resultsSnapshot.docs.map(async doc => {
            const resultData = doc.data();
            let testTitle = 'Test no encontrado';
            
            if (resultData.testId) {
              const testDoc = await getDoc(doc(db, 'tests', resultData.testId));
              if (testDoc.exists()) {
                testTitle = testDoc.data().title;
              }
            }
            
            return {
              id: doc.id,
              ...resultData,
              testTitle
            };
          })
        ) as TestResult[];
        
        setUserResults(results);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

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

  const handleCreateCustomTest = async () => {
    try {
      if (customTest.blocks.length === 0) {
        toast.error('Debes agregar al menos un bloque al test');
        return;
      }

      if (!customTest.title.trim()) {
        toast.error('El test debe tener un título');
        return;
      }

      // Verificar si el usuario tiene acceso a tests personalizados
      const userDoc = await getDoc(doc(db, 'users', currentUser!.uid));
      if (!userDoc.exists()) {
        toast.error('Usuario no encontrado');
        return;
      }

      const userData = userDoc.data();
      if (!userData.planId) {
        toast.error('Necesitas un plan para crear tests personalizados');
        return;
      }

      const planDoc = await getDoc(doc(db, 'plans', userData.planId));
      if (!planDoc.exists() || !planDoc.data().hasCustomTest) {
        toast.error('Tu plan no incluye la creación de tests personalizados');
        return;
      }

      const newTest = {
        ...customTest,
        createdBy: currentUser!.uid,
        createdAt: new Date(),
        updatedAt: new Date()
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
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {currentUser?.email}
          </h1>
          <p className="mt-2 text-gray-600">
            Aquí puedes ver tus estadísticas, tests disponibles y crear tests personalizados.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowCustomizeModal(true)}
            className="flex items-center px-4 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b] transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Crear Test Personalizado
          </button>
          <button
            onClick={handleStartRandomTest}
            className="px-4 py-2 border border-[#91c26a] text-[#91c26a] rounded-lg hover:bg-[#f0f7eb] transition-colors"
          >
            Test Aleatorio
          </button>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Progreso Reciente</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#91c26a"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Distribución de Rendimiento</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {performanceData.map((entry, index) => (
                <div key={entry.name} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-sm text-gray-600">
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
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
                onClick={handleCreateCustomTest}
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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie
} from 'recharts';
import {
  Brain,
  Clock,
  Trophy,
  ChevronRight,
  Plus,
  Calendar,
  Settings,
  AlertCircle
} from 'lucide-react';

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
  timeSpent: number;
  answers: Array<{
    blockName: string;
    isCorrect: boolean;
    questionId: string;
  }>;
  blocks?: Array<{
    type: string;
    total: number;
    correct: number;
  }>;
  blocksUsed: string;
  questionsAnswered: number;
}

interface BlockConfig {
  type: 'Texto' | 'Memoria' | 'Distracción' | 'Secuencia';
  quantity: number;
}

interface BlockPerformance {
  name: string;
  score: number;
  value: number;  // For chart compatibility
  correct: number;
  total: number;
}

interface PerformanceData {
  timeProgress: Array<{
    date: string;
    score: number;
    timeSpent: number;
    timeFormatted: string;
  }>;
  blockPerformance: BlockPerformance[];
  categoryDistribution: Array<{
    name: string;
    value: number;
  }>;
}

interface ReportData {
  type: string;
  description: string;
}

const COLORS = ['#91c26a', '#fbbf24', '#ef4444'];

const Dashboard: React.FC = () => {
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

  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    timeProgress: [],
    blockPerformance: [],
    categoryDistribution: []
  });

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<ReportData>({
    type: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingTest, setIsCreatingTest] = useState(false);

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
            
            console.log('Plan Data:', planData);
            console.log('customTestsEnabled:', planData?.customTestsEnabled);
            
            setUserPlan({
              name: userData.planName,
              expiresAt: userData.planExpiresAt,
              purchasedAt: userData.planPurchasedAt,
              customTestsEnabled: planData?.customTestsEnabled || false
            });

            console.log('User Plan State:', {
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
          }
        }

        try {
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
        } catch (error) {
          console.error('Error al cargar los tests:', error);
          toast.error('Error al cargar los tests disponibles');
        }

        try {
          // Primero intentamos obtener solo los resultados filtrados por userId
          const resultsQuery = query(
            collection(db, 'testResults'),
            where('userId', '==', currentUser.uid),
            orderBy('completedAt', 'desc')
          );
          const resultsSnapshot = await getDocs(resultsQuery);
          
          const resultsData = resultsSnapshot.docs
            .map(doc => {
              const data = doc.data();
              console.log('Resultado raw de Firestore:', data);
              return {
                id: doc.id,
                ...data,
                answers: data.answers || [] // Asegurarnos de que siempre haya un array de answers
              };
            })
            .sort((a: any, b: any) => {
              const dateA = a.completedAt?.toDate?.() || new Date(0);
              const dateB = b.completedAt?.toDate?.() || new Date(0);
              return dateB.getTime() - dateA.getTime();
            }) as TestResult[];
            
          console.log('Resultados procesados:', resultsData);
          setUserResults(resultsData);

          // Procesar datos para los gráficos
          const timeProgressData = resultsData
            .filter(result => result.completedAt && result.score != null && result.timeSpent != null)
            .map(result => {
              const timeInMinutes = Math.floor((Number(result.timeSpent) || 0) / 60);
              const timeInSeconds = Math.floor((Number(result.timeSpent) || 0) % 60);
              return {
                date: result.completedAt?.toDate?.() 
                  ? new Date(result.completedAt.toDate()).toLocaleDateString() 
                  : 'Fecha desconocida',
                score: Number(result.score) || 0,
                timeSpent: timeInMinutes,
                timeFormatted: `${timeInMinutes}:${timeInSeconds.toString().padStart(2, '0')}`
              };
            })
            .reverse(); // Para mostrar progreso cronológico

          // Calcular rendimiento por bloque
          const blockPerformanceData = calculateBlockPerformance(resultsData);
          console.log('Rendimiento por bloque calculado:', blockPerformanceData);

          // Calcular distribución de categorías
          const categoryStats = resultsData
            .filter(result => result.score != null)
            .reduce((acc: any, result) => {
              const score = Number(result.score) || 0;
              const category = score >= 80 ? 'Memoria' :
                             score >= 60 ? 'Secuencia' : 'Texto';
              acc[category] = (acc[category] || 0) + 1;
              return acc;
            }, {});

          const categoryDistributionData = Object.entries(categoryStats)
            .map(([name, value]) => ({
              name,
              value: Number(value) || 0
            }))
            .filter(item => item.value > 0); // Solo incluir categorías con datos

          setPerformanceData({
            timeProgress: timeProgressData,
            blockPerformance: blockPerformanceData,
            categoryDistribution: categoryDistributionData
          });

        } catch (error) {
          console.error('Error al cargar los resultados:', error);
          toast.error('Error al cargar el historial de resultados');
        }

      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  const handleCreateCustomTest = async () => {
    setIsCreatingTest(true);

    try {
      // Crear el nuevo test
      const newTest = {
        createdBy: currentUser!.uid,
        createdAt: new Date(),
        type: 'custom',
        userId: currentUser!.uid,
        title: customTest.title,
        description: customTest.description,
        timeLimit: customTest.timeLimit,
        blocks: customTest.blocks,
        memorizeTime: customTest.memorizeTime,
        distractionTime: customTest.distractionTime,
        isPublic: customTest.isPublic
      };

      const testRef = await addDoc(collection(db, 'tests'), newTest);
      const testWithId = { id: testRef.id, ...newTest };
      
      toast.success('Test creado exitosamente');
      setShowCustomizeModal(false);
      setCustomTest({
        title: '',
        description: '',
        timeLimit: 30,
        blocks: [],
        memorizeTime: 60,
        distractionTime: 30,
        isPublic: false
      });

      // Actualizar la lista de tests disponibles
      setAvailableTests(prev => [...prev, testWithId]);
    } catch (error) {
      console.error('Error creating custom test:', error);
      toast.error('Error al crear el test personalizado');
    } finally {
      setIsCreatingTest(false);
    }
  };

  const handleStartTest = (testId: string) => {
    navigate(`/test/${testId}`);
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

  const calculateBlockPerformance = (results: TestResult[]): BlockPerformance[] => {
    if (!results || results.length === 0) {
      return [];
    }

    const blockPerformance: { [key: string]: { total: number; correct: number; attempts: number } } = {};

    results.forEach(result => {
      if (result.answers && Array.isArray(result.answers)) {
        const blockStats = result.answers.reduce((acc, answer) => {
          const blockName = answer.blockName || 'Sin bloque';
          if (!acc[blockName]) {
            acc[blockName] = { total: 0, correct: 0 };
          }
          acc[blockName].total += 1;
          if (answer.isCorrect) {
            acc[blockName].correct += 1;
          }
          return acc;
        }, {} as { [key: string]: { total: number; correct: number } });

        Object.entries(blockStats).forEach(([blockName, stats]) => {
          if (!blockPerformance[blockName]) {
            blockPerformance[blockName] = { total: 0, correct: 0, attempts: 0 };
          }
          blockPerformance[blockName].total += stats.total;
          blockPerformance[blockName].correct += stats.correct;
          blockPerformance[blockName].attempts += 1;
        });
      }
    });

    return Object.entries(blockPerformance)
      .map(([name, stats]) => {
        const score = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        return {
          name,
          score,
          value: score, // For chart compatibility
          correct: stats.correct,
          total: stats.total
        };
      })
      .filter(block => block.score > 0);
  };

  const calculateUserStats = (results: TestResult[]) => {
    if (!results || results.length === 0) {
      return {
        averageScore: 0,
        completedTests: 0,
        totalStudyTime: 0
      };
    }

    const totalScore = results.reduce((sum, result) => sum + (result.score || 0), 0);
    const totalTime = results.reduce((sum, result) => sum + (result.timeSpent || 0), 0); // en segundos
    
    return {
      averageScore: Math.round(totalScore / results.length),
      completedTests: results.length,
      totalStudyTime: totalTime
    };
  };

  const formatStudyTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const BlockPerformance = ({ data }: { data: BlockPerformance[] }) => {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Rendimiento por Bloque</h3>
        <div className="space-y-4">
          {data.map((block, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{block.name}</span>
                <span>{block.score}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-[#91c26a] rounded-full"
                  style={{ width: `${block.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleSubmitReport = async (reportData: ReportData) => {
    setIsSubmitting(true);

    try {
      if (!currentUser?.uid) {
        toast.error('Debes iniciar sesión para enviar reportes');
        return;
      }

      if (!reportData.type || !reportData.description) {
        toast.error('Por favor completa todos los campos del reporte');
        return;
      }

      const newReport = {
        userId: currentUser.uid,
        type: reportData.type.trim(),
        description: reportData.description.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        email: currentUser.email || 'No disponible',
        userName: currentUser.displayName || 'Usuario sin nombre'
      };

      const reportsRef = collection(db, 'reports');
      await addDoc(reportsRef, newReport);
      
      toast.success('Reporte enviado exitosamente');
      setShowReportModal(false);
      setReportData({ type: '', description: '' });
    } catch (error: any) {
      console.error('Error sending report:', error);
      if (error.code === 'permission-denied') {
        toast.error('No tienes permisos para enviar reportes. Por favor, verifica tu sesión.');
      } else {
        toast.error('Error al enviar el reporte. Por favor, intenta nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="flex flex-col items-start space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#91c26a] to-[#82b35b] bg-clip-text text-transparent">
            Bienvenido, {currentUser?.displayName || 'Usuario'}
          </h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">Correo:</span>
            <span className="text-sm text-gray-800 bg-gray-100 px-3 py-1 rounded-full">
              {currentUser?.email}
            </span>
          </div>
        </div>

        {userPlan && (
          <div className="mt-4 md:mt-0 bg-gradient-to-br from-white to-[#e9f5db] rounded-lg shadow-sm p-4 flex items-center space-x-4 border border-[#91c26a]/20">
            <div className="bg-[#91c26a] bg-opacity-10 p-2 rounded-full">
              <Calendar className="h-6 w-6 text-[#91c26a]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{userPlan.name}</p>
              <p className="text-xs text-[#91c26a]">
                {daysLeft} días restantes
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-white to-[#e9f5db] rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate('/custom-test-creator')}
            className={`flex items-center px-6 py-3 rounded-lg transition-all duration-300 ${
              isCreatingTest 
                ? 'bg-gray-400 cursor-not-allowed' 
                : userPlan?.customTestsEnabled === true 
                  ? 'bg-gradient-to-r from-[#91c26a] to-[#82b35b] text-white hover:shadow-lg transform hover:-translate-y-0.5' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isCreatingTest ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creando...
              </div>
            ) : (
              <span>Crear Test Personalizado</span>
            )}
            <Plus className="h-5 w-5 ml-2" />
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center px-6 py-3 rounded-lg transition-all duration-300 bg-white border border-[#91c26a] text-[#91c26a] hover:bg-[#91c26a] hover:text-white hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Reportar Problema</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Puntuación Media */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <Trophy className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Puntuación Media</h3>
            <p className="text-2xl font-semibold text-gray-900">{calculateUserStats(userResults).averageScore}%</p>
          </div>
        </div>

        {/* Tests Completados */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Tests Completados</h3>
            <p className="text-2xl font-semibold text-gray-900">{calculateUserStats(userResults).completedTests}</p>
          </div>
        </div>

        {/* Tiempo de Estudio */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Tiempo de Estudio</h3>
            <p className="text-2xl font-semibold text-gray-900">{formatStudyTime(calculateUserStats(userResults).totalStudyTime)}</p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Progreso */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Progreso en el Tiempo</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={performanceData.timeProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#91c26a" name="Puntuación" />
                <Line type="monotone" dataKey="timeSpent" stroke="#fbbf24" name="Tiempo (min)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Distribución por Categorías */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Distribución por Categorías</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={performanceData.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {performanceData.categoryDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
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
                <p className="text-xs text-[#91c26a]">
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
              className="bg-[#91c26a] text-white px-4 py-2 rounded-lg hover:bg-[#82b35b] transition-colors"
            >
              Ver planes disponibles
            </button>
          </div>
        )}
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
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
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

      {/* Modal de Reporte */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-[#91c26a]" />
              Reportar Problema
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSubmitReport(reportData);
            }} className="space-y-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Problema
                </label>
                <select
                  id="type"
                  value={reportData.type}
                  onChange={(e) => setReportData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#91c26a]/50 focus:border-[#91c26a]"
                  required
                >
                  <option value="">Selecciona un tipo</option>
                  <option value="bug">Error en la aplicación</option>
                  <option value="content">Problema con el contenido</option>
                  <option value="suggestion">Sugerencia de mejora</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  id="description"
                  value={reportData.description}
                  onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#91c26a]/50 focus:border-[#91c26a] h-32"
                  placeholder="Describe el problema en detalle..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-[#91c26a] text-white hover:bg-[#82b35b] transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

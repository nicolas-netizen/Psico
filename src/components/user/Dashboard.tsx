import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Book, Calendar, Crown, Settings, Target, User } from 'lucide-react';

interface UserPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  daysRemaining: number;
  hasCustomTest: boolean;
}

interface Test {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: string;
  plans: string[];
  questions: any[];
  timeLimit: number;
}

interface ProgressBarProps {
  percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
  const getColorClass = (percentage: number) => {
    if (percentage >= 80) return 'bg-[#91c26a]'; // Verde para excelente
    if (percentage >= 50) return 'bg-yellow-500'; // Amarillo para aprobado
    return 'bg-red-500'; // Rojo para no aprobado
  };

  const getStatusText = (percentage: number) => {
    if (percentage >= 80) return 'Completado';
    if (percentage >= 50) return 'Aprobado';
    return 'No Aprobado';
  };

  return (
    <div className="space-y-1">
      <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColorClass(percentage)} transition-all duration-300 flex items-center justify-center text-white text-xs font-medium`}
          style={{ width: `${percentage}%` }}
        >
          {percentage.toFixed(1)}%
        </div>
      </div>
      <div className={`text-xs font-medium ${percentage < 50 ? 'text-red-500' : 'text-gray-600'}`}>
        {getStatusText(percentage)}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [discountCode, setDiscountCode] = useState('');
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);

  useEffect(() => {
    loadUserData();
    loadAvailablePlans();
    loadRecentResults();
  }, [currentUser]);

  const loadUserData = async () => {
    try {
      if (!currentUser) return;

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      if (userData?.planId) {
        const planDoc = await getDoc(doc(db, 'plans', userData.planId));
        const planData = planDoc.data();
        
        setUserPlan({
          id: planDoc.id,
          name: planData?.name || '',
          price: planData?.price || 0,
          features: planData?.features || [],
          daysRemaining: Math.ceil((userData.planExpiryDate?.toDate() - new Date()) / (1000 * 60 * 60 * 24)) || 0,
          hasCustomTest: planData?.hasCustomTest || false
        });

        // Obtener tests disponibles para el plan del usuario
        const testsQuery = query(
          collection(db, 'tests'),
          where('plans', 'array-contains', userData.planId)
        );
        const testsSnapshot = await getDocs(testsQuery);
        setAvailableTests(
          testsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Test[]
        );
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Error al cargar los datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePlans = async () => {
    try {
      const plansSnapshot = await getDocs(collection(db, 'plans'));
      const plans = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailablePlans(plans.sort((a, b) => a.price - b.price));
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Error al cargar los planes disponibles');
    }
  };

  const verifyDiscountCode = async () => {
    if (!discountCode) return;
    
    setApplyingDiscount(true);
    try {
      const discountQuery = query(
        collection(db, 'discountCodes'),
        where('code', '==', discountCode.toUpperCase()),
        where('isActive', '==', true)
      );
      const discountSnapshot = await getDocs(discountQuery);
      
      if (!discountSnapshot.empty) {
        const discountData = discountSnapshot.docs[0].data();
        if (discountData.currentUses < discountData.maxUses &&
            new Date() < discountData.validUntil.toDate()) {
          setDiscountedPrice(discountData.discount);
          toast.success(`Código válido! ${discountData.discount}% de descuento aplicado`);
        } else {
          toast.error('Código de descuento no válido o expirado');
          setDiscountedPrice(null);
        }
      } else {
        toast.error('Código de descuento no válido');
        setDiscountedPrice(null);
      }
    } catch (error) {
      console.error('Error verifying discount code:', error);
      toast.error('Error al verificar el código de descuento');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleStartTest = async (testId: string) => {
    try {
      // Navegar a la página del test
      navigate(`/test/${testId}`);
    } catch (error) {
      console.error('Error starting test:', error);
      toast.error('Error al iniciar el test');
    }
  };

  const handlePurchasePlan = async (planId: string, price: number) => {
    try {
      setLoading(true);
      
      let finalPrice = price;
      if (discountedPrice) {
        finalPrice = price * (1 - discountedPrice / 100);
      }

      // Aquí iría la integración con el sistema de pagos
      // Por ahora solo actualizamos el plan del usuario
      const planExpiryDate = new Date();
      planExpiryDate.setDate(planExpiryDate.getDate() + 30);

      await updateDoc(doc(db, 'users', currentUser.uid), {
        planId,
        planExpiryDate,
      });

      if (discountCode) {
        const discountQuery = query(
          collection(db, 'discountCodes'),
          where('code', '==', discountCode.toUpperCase())
        );
        const discountSnapshot = await getDocs(discountQuery);
        if (!discountSnapshot.empty) {
          await updateDoc(doc(db, 'discountCodes', discountSnapshot.docs[0].id), {
            currentUses: discountSnapshot.docs[0].data().currentUses + 1
          });
        }
      }

      toast.success('Plan actualizado exitosamente');
      setDiscountCode('');
      setDiscountedPrice(null);
      loadUserData();
    } catch (error) {
      console.error('Error purchasing plan:', error);
      toast.error('Error al procesar la compra');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentResults = async () => {
    if (!currentUser) return;
    
    try {
      setLoadingResults(true);
      const results = await getDocs(collection(db, 'testResults', currentUser.uid, 'results'));
      // Ordenar por fecha más reciente y tomar los últimos 5
      const sortedResults = results.docs.map(doc => doc.data())
        .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
        .slice(0, 5);
      setRecentResults(sortedResults);
    } catch (error) {
      console.error('Error al cargar resultados recientes:', error);
      toast.error('Error al cargar los resultados recientes');
    } finally {
      setLoadingResults(false);
    }
  };

  const handleViewAllResults = () => {
    navigate('/results');
  };

  const handleRetakeTest = (testId: string) => {
    navigate(`/test/${testId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Usuario</h1>
              <p className="mt-1 text-sm text-gray-500">
                Bienvenido, {currentUser?.email}
              </p>
            </div>
            {userPlan && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{userPlan.name}</p>
                  <p className="text-xs text-gray-500">{userPlan.daysRemaining} días restantes</p>
                </div>
                <Crown className="h-6 w-6 text-[#91c26a]" />
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Tests Disponibles */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Book className="h-6 w-6 text-[#91c26a]" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Tests Disponibles</dt>
                    <dd className="text-lg font-semibold text-gray-900">{availableTests.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <button
                  onClick={() => navigate('/tests')}
                  className="font-medium text-[#91c26a] hover:text-[#82b35b] flex items-center"
                >
                  Ver todos
                  <ArrowRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Plan Actual */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Crown className="h-6 w-6 text-[#91c26a]" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Plan Actual</dt>
                    <dd className="text-lg font-semibold text-gray-900">{userPlan?.name || 'Sin plan'}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <button
                  onClick={() => navigate('/planes')}
                  className="font-medium text-[#91c26a] hover:text-[#82b35b] flex items-center"
                >
                  Cambiar plan
                  <ArrowRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tests Personalizados */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-6 w-6 text-[#91c26a]" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Tests Personalizados</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {userPlan?.hasCustomTest ? 'Disponible' : 'No disponible'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                {userPlan?.hasCustomTest ? (
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        navigate('/login');
                        return;
                      }
                      navigate('/test-screen');
                    }}
                    className="font-medium text-[#91c26a] hover:text-[#82b35b] flex items-center"
                  >
                    Crear test
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/planes')}
                    className="font-medium text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    Mejorar plan
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Results Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Resultados Recientes</h3>
          </div>
          <div className="px-6 py-5">
            {loadingResults ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#91c26a]"></div>
              </div>
            ) : recentResults.length > 0 ? (
              <div className="space-y-6">
                {recentResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{result.testTitle}</h4>
                      <p className="text-sm text-gray-500">{new Date(result.date).toLocaleDateString()}</p>
                    </div>
                    <div className="w-32">
                      <ProgressBar percentage={result.score} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay resultados</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comienza tomando algunos tests para ver tus resultados aquí.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

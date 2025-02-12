import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface UserPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  daysRemaining: number;
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
        });

        // Obtener tests disponibles para el plan del usuario
        const testsQuery = query(
          collection(db, 'tests'),
          where('plans', 'array-contains', userData.planId)
        );
        const testsSnapshot = await getDocs(testsQuery);
        const tests = testsSnapshot.docs.map(doc => {
          const testData = doc.data();
          return {
            id: doc.id,
            ...testData,
            available: true // Si el test aparece es porque está disponible para el plan
          };
        }) as Test[];
        
        setAvailableTests(tests);
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
    <div className="min-h-screen bg-gray-50 pt-24 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Plan Actual */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tu Plan Actual</h2>
          {userPlan ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-indigo-600">{userPlan.name}</h3>
                <span className="text-gray-600">{userPlan.daysRemaining} días restantes</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Beneficios:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {userPlan.features.map((feature, index) => (
                      <li key={index} className="text-gray-600">{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No tienes un plan activo</p>
              <p className="text-sm text-gray-500">Selecciona un plan para acceder a todos los tests</p>
            </div>
          )}
        </div>

        {/* Tests Disponibles */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tests Disponibles</h2>
          {availableTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableTests.map((test) => (
                <div key={test.id} className="border rounded-lg p-4 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{test.title}</h3>
                    <span className="text-xs text-gray-500">{test.timeLimit} min</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{test.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-indigo-600 font-medium">
                      {test.category}
                    </span>
                    <button
                      onClick={() => handleStartTest(test.id)}
                      className="py-2 px-4 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Realizar Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No hay tests disponibles para tu plan actual</p>
            </div>
          )}
        </div>

        {/* Resultados Recientes */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Resultados Recientes</h2>
            {recentResults.length > 0 && (
              <button
                onClick={handleViewAllResults}
                className="text-[#91c26a] hover:text-[#7ea756] font-medium"
              >
                Ver todos
              </button>
            )}
          </div>

          {loadingResults ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#91c26a]"></div>
            </div>
          ) : recentResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No hay resultados disponibles</p>
              <button
                onClick={() => navigate('/tests')}
                className="text-[#91c26a] hover:text-[#7ea756] font-medium"
              >
                Realizar tu primer test
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {recentResults.map((result) => {
                const percentage = (result.score / result.totalQuestions) * 100;
                return (
                  <div 
                    key={result.id} 
                    className={`bg-white border rounded-lg p-6 ${
                      percentage < 50 ? 'border-red-300' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">
                          {result.testName || 'Test sin nombre'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {new Date(result.completedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRetakeTest(result.testId)}
                          className="text-[#91c26a] hover:text-[#7ea756] text-sm font-medium"
                        >
                          Repetir Test
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-700 mb-2">
                        Puntuación: {result.score}/{result.totalQuestions}
                      </p>
                      <ProgressBar percentage={percentage} />
                    </div>

                    {percentage < 50 && (
                      <div className="mt-3 text-sm text-red-500">
                        Test no completado satisfactoriamente. Se recomienda volver a intentar.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comprar Plan */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Actualizar Plan</h2>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="Código de descuento"
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                onClick={verifyDiscountCode}
                disabled={applyingDiscount || !discountCode}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {applyingDiscount ? 'Verificando...' : 'Aplicar'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePlans.map((plan) => {
              const finalPrice = discountedPrice 
                ? plan.price * (1 - discountedPrice / 100) 
                : plan.price;
              
              return (
                <div key={plan.id} className="border rounded-lg p-6 hover:shadow-lg transition-all">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    {discountedPrice ? (
                      <div>
                        <span className="text-3xl font-bold text-indigo-600">${finalPrice}</span>
                        <span className="text-sm text-gray-500 line-through ml-2">${plan.price}</span>
                        <span className="text-sm text-gray-500 font-normal">/mes</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-indigo-600">${plan.price}</span>
                        <span className="text-sm text-gray-500 font-normal">/mes</span>
                      </div>
                    )}
                  </div>
                  <ul className="mb-6 space-y-2">
                    {plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center text-gray-600">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handlePurchasePlan(plan.id, plan.price)}
                    disabled={loading || (userPlan?.id === plan.id)}
                    className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
                      userPlan?.id === plan.id
                        ? 'bg-green-500 text-white cursor-default'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                    } disabled:opacity-50`}
                  >
                    {loading ? 'Procesando...' : 
                     userPlan?.id === plan.id ? 'Plan Actual' : 
                     'Seleccionar Plan'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

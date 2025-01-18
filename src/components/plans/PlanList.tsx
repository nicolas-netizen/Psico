import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-hot-toast';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
  tests?: string[];
}

interface PromoCode {
  code: string;
  discount: number;
  validUntil: Timestamp;
  planId?: string;
}

const PlanList: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        console.log('Fetching plans from Firebase...');
        const plansRef = collection(db, 'plans');
        const snapshot = await getDocs(plansRef);
        
        const plansData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Plan[];

        console.log('Plans fetched:', plansData);
        
        plansData.sort((a, b) => a.price - b.price);
        
        if (plansData.length >= 2) {
          plansData[1].popular = true;
        }

        setPlans(plansData);
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast.error('Error al cargar los planes');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const validatePromoCode = async (code: string): Promise<PromoCode | null> => {
    try {
      const promoRef = doc(db, 'promoCodes', code.toUpperCase());
      const promoDoc = await getDoc(promoRef);
      
      if (!promoDoc.exists()) {
        toast.error('Código promocional inválido');
        return null;
      }

      const promoData = promoDoc.data() as PromoCode;
      const now = Timestamp.now();

      if (promoData.validUntil.toDate() < now.toDate()) {
        toast.error('El código promocional ha expirado');
        return null;
      }

      if (promoData.planId && promoData.planId !== selectedPlan?.id) {
        toast.error('Este código no es válido para el plan seleccionado');
        return null;
      }

      return promoData;
    } catch (error) {
      console.error('Error validating promo code:', error);
      toast.error('Error al validar el código promocional');
      return null;
    }
  };

  const assignPlanToUser = async (planId: string, promoDiscount: number = 0) => {
    if (!user) return;

    try {
      const userPlanRef = doc(db, 'userPlans', user.uid);
      const plan = plans.find(p => p.id === planId);
      
      if (!plan) {
        toast.error('Plan no encontrado');
        return;
      }

      const finalPrice = plan.price * (1 - promoDiscount);

      await setDoc(userPlanRef, {
        userId: user.uid,
        planId: planId,
        planName: plan.name,
        price: finalPrice,
        startDate: Timestamp.now(),
        endDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 días
        tests: plan.tests || [],
        active: true
      });

      toast.success('¡Plan activado correctamente!');
      setShowPromoModal(false);
      setPromoCode('');
    } catch (error) {
      console.error('Error assigning plan:', error);
      toast.error('Error al activar el plan');
    }
  };

  const handleSelectPlan = async (plan: Plan) => {
    if (!user) {
      toast.error('Debes iniciar sesión para seleccionar un plan');
      return;
    }

    setSelectedPlan(plan);
    setShowPromoModal(true);
  };

  const handlePromoSubmit = async () => {
    if (!selectedPlan) return;
    
    setPromoLoading(true);
    
    try {
      if (promoCode.trim()) {
        const promoData = await validatePromoCode(promoCode);
        if (promoData) {
          await assignPlanToUser(selectedPlan.id, promoData.discount);
        }
      } else {
        await assignPlanToUser(selectedPlan.id);
      }
    } finally {
      setPromoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando planes disponibles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 pb-32">
        <div className="max-w-7xl mx-auto pt-12 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
            Planes y Precios
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-indigo-100">
            Elige el plan que mejor se adapte a tus necesidades
          </p>
        </div>
      </div>

      {/* Pricing section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-[-8rem] space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col ${
                plan.popular ? 'ring-2 ring-indigo-600' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
                  <span className="inline-flex rounded-full bg-indigo-600 px-4 py-1 text-sm font-semibold text-white">
                    Más Popular
                  </span>
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>

                <p className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-5xl font-extrabold tracking-tight">
                    ${typeof plan.price === 'number' ? plan.price.toFixed(2) : plan.price}
                  </span>
                  <span className="ml-1 text-xl font-semibold">/mes</span>
                </p>

                <ul className="mt-6 space-y-6">
                  {plan.features?.map((feature) => (
                    <li key={feature} className="flex">
                      <svg
                        className="flex-shrink-0 w-6 h-6 text-indigo-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="ml-3 text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium ${
                  plan.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Elegir Plan
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Promo Code Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Activar Plan {selectedPlan?.name}
            </h3>
            
            <div className="mb-4">
              <label htmlFor="promoCode" className="block text-sm font-medium text-gray-700 mb-2">
                ¿Tienes un código promocional? (opcional)
              </label>
              <input
                type="text"
                id="promoCode"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ingresa tu código"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPromoModal(false);
                  setPromoCode('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handlePromoSubmit}
                disabled={promoLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {promoLoading ? 'Procesando...' : 'Activar Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
        <div className="max-w-3xl mx-auto divide-y-2 divide-gray-200">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Preguntas Frecuentes
          </h2>
          <dl className="mt-6 space-y-6 divide-y divide-gray-200">
            <div className="pt-6">
              <dt className="text-lg font-medium text-gray-900">
                ¿Puedo cambiar de plan en cualquier momento?
              </dt>
              <dd className="mt-2 text-base text-gray-500">
                Sí, puedes actualizar o cambiar tu plan en cualquier momento. Los cambios se aplicarán inmediatamente.
              </dd>
            </div>
            <div className="pt-6">
              <dt className="text-lg font-medium text-gray-900">
                ¿Hay un período de prueba?
              </dt>
              <dd className="mt-2 text-base text-gray-500">
                Ofrecemos un plan gratuito que te permite probar algunas funcionalidades básicas de nuestra plataforma.
              </dd>
            </div>
            <div className="pt-6">
              <dt className="text-lg font-medium text-gray-900">
                ¿Cómo se factura la suscripción?
              </dt>
              <dd className="mt-2 text-base text-gray-500">
                La facturación es mensual y se realiza de forma automática. Puedes cancelar en cualquier momento.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default PlanList;

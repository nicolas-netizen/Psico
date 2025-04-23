import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Check, Star, AlertCircle, CreditCard } from 'lucide-react';
import { toast } from 'react-toastify';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  duration: number;
  isFeatured: boolean;
}

const PlansPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'plans'));
        const plansData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Plan[];
        setPlans(plansData.sort((a, b) => a.price - b.price));
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast.error('Error al cargar los planes');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handlePurchase = async (planId: string) => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para comprar un plan');
      navigate('/login', { state: { from: `/checkout/${planId}` } });
      return;
    }

    try {
      setSelectedPlan(planId);
      // Redirigir al usuario a la página de checkout
      navigate(`/checkout/${planId}`);
    } catch (error) {
      console.error('Error iniciando proceso de pago:', error);
      toast.error('Error al iniciar el proceso de pago. Por favor, intenta nuevamente.');
      setSelectedPlan(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f8faf6] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Elige el Plan Perfecto para Ti
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Todos nuestros planes incluyen acceso completo a nuestra plataforma de tests psicotécnicos
            y herramientas de preparación.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden 
                         transition-transform duration-300 hover:scale-105 
                         ${plan.isFeatured ? 'ring-2 ring-[#91c26a]' : ''}`}
            >
              {plan.isFeatured && (
                <div className="absolute top-4 right-4">
                  <div className="bg-[#91c26a] text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Más Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <div className="mt-8 space-y-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="ml-2 text-lg text-gray-600"></span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-[#91c26a]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">
                      Duración: {plan.duration} días
                    </span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-[#91c26a] mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={selectedPlan === plan.id}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center
                             ${plan.isFeatured
                               ? 'bg-[#91c26a] text-white hover:bg-[#82b35b]'
                               : 'border-2 border-[#91c26a] text-[#91c26a] hover:bg-[#91c26a] hover:text-white'
                             } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  {selectedPlan === plan.id ? 'Procesando...' : 'Pagar Ahora'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Preguntas Frecuentes
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-[#91c26a]" />
                ¿Puedo cambiar de plan más adelante?
              </h3>
              <p className="text-gray-600">
                Sí, puedes actualizar o cambiar tu plan en cualquier momento. Los cambios se aplicarán
                al finalizar tu período actual.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-[#91c26a]" />
                ¿Qué métodos de pago aceptan?
              </h3>
              <p className="text-gray-600">
                Aceptamos pagos con tarjetas de crédito/débito a través de Stripe y también PayPal.
                Todos nuestros métodos de pago son seguros y encriptados.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-[#91c26a]" />
                ¿Hay un período de prueba?
              </h3>
              <p className="text-gray-600">
                Todos nuestros planes incluyen una garantía de satisfacción. Si no estás conforme,
                puedes cancelar en los primeros 7 días.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;

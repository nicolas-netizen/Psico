import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import StripeProvider from '../components/payments/StripeProvider';
import StripeCheckout from '../components/payments/StripeCheckout';
import PayPalCheckout from '../components/payments/PayPalCheckout';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number; // in USD
  duration: number; // in days
  features: string[];
  customTestsEnabled?: boolean;
}

const Checkout: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');

  useEffect(() => {
    const fetchPlan = async () => {
      if (!planId) {
        toast.error('No se especificó un plan');
        navigate('/plans');
        return;
      }

      if (!currentUser) {
        toast.error('Debes iniciar sesión para realizar una compra');
        navigate('/login', { state: { from: `/checkout/${planId}` } });
        return;
      }

      try {
        const planDoc = await getDoc(doc(db, 'plans', planId));
        if (!planDoc.exists()) {
          toast.error('El plan seleccionado no existe');
          navigate('/plans');
          return;
        }

        setPlan({
          id: planDoc.id,
          ...planDoc.data() as Omit<Plan, 'id'>
        });
      } catch (error) {
        console.error('Error fetching plan:', error);
        toast.error('Error al cargar el plan');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId, navigate, currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-800">Plan no encontrado</h2>
        <p className="mt-2 text-gray-600">El plan que intentas comprar no existe o no está disponible.</p>
        <button
          onClick={() => navigate('/plans')}
          className="mt-4 px-4 py-2 bg-[#91c26a] text-white rounded-md hover:bg-[#82b35b]"
        >
          Ver planes disponibles
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Completar compra</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen de tu compra</h2>
        
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-1 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-lg text-gray-900">{plan.name}</h3>
            <p className="text-gray-600 mt-1">{plan.description}</p>
            <div className="mt-4">
              <span className="text-2xl font-bold text-[#91c26a]">${plan.price}</span>
              <span className="text-gray-500 ml-2">/ {plan.duration} días</span>
            </div>
          </div>
          
          <div className="flex-1 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Características incluidas:</h3>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-5 w-5 text-[#91c26a] mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Método de pago</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={() => setPaymentMethod('stripe')}
            className={`flex-1 p-4 rounded-lg border-2 ${
              paymentMethod === 'stripe' 
                ? 'border-[#91c26a] bg-[#91c26a]/10' 
                : 'border-gray-200 hover:border-gray-300'
            } transition-colors`}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                paymentMethod === 'stripe' ? 'border-[#91c26a]' : 'border-gray-400'
              }`}>
                {paymentMethod === 'stripe' && (
                  <div className="w-3 h-3 rounded-full bg-[#91c26a]"></div>
                )}
              </div>
              <span className="font-medium">Tarjeta de crédito / débito</span>
            </div>
          </button>
          
          <button
            onClick={() => setPaymentMethod('paypal')}
            className={`flex-1 p-4 rounded-lg border-2 ${
              paymentMethod === 'paypal' 
                ? 'border-[#91c26a] bg-[#91c26a]/10' 
                : 'border-gray-200 hover:border-gray-300'
            } transition-colors`}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                paymentMethod === 'paypal' ? 'border-[#91c26a]' : 'border-gray-400'
              }`}>
                {paymentMethod === 'paypal' && (
                  <div className="w-3 h-3 rounded-full bg-[#91c26a]"></div>
                )}
              </div>
              <span className="font-medium">PayPal</span>
            </div>
          </button>
        </div>
        
        {paymentMethod === 'stripe' ? (
          <StripeProvider>
            <StripeCheckout 
              planId={plan.id} 
              planName={plan.name} 
              amount={plan.price * 100} // Stripe expects amount in cents
              duration={plan.duration} 
            />
          </StripeProvider>
        ) : (
          <PayPalCheckout 
            planId={plan.id} 
            planName={plan.name} 
            amount={plan.price} 
            duration={plan.duration} 
          />
        )}
      </div>
      
      <div className="text-center">
        <button
          onClick={() => navigate('/plans')}
          className="text-[#91c26a] hover:text-[#82b35b] font-medium"
        >
          Cancelar y volver a planes
        </button>
      </div>
    </div>
  );
};

export default Checkout;

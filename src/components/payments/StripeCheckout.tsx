import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

interface StripeCheckoutProps {
  planId: string;
  planName: string;
  amount: number; // amount in cents
  duration: number; // duration in days
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({ planId, planName, amount, duration }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [cardholderName, setCardholderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    if (!stripe || !elements) {
      setPaymentError('No se pudo conectar con el procesador de pagos');
      setIsProcessing(false);
      return;
    }
    
    const cardElement = elements.getElement(CardElement);
    
    if (!cardElement) {
      setPaymentError('Error al procesar los datos de la tarjeta');
      setIsProcessing(false);
      return;
    }
    
    try {
      // ===== MODO DE PRUEBA =====
      // En un entorno real, deberías crear un PaymentIntent en tu servidor
      // Para pruebas, simulamos un pago exitoso sin hacer llamadas reales a Stripe
      console.log('Simulando pago exitoso con Stripe');
      
      // Simular validación de tarjeta (en producción esto lo hace Stripe)
      if (!cardholderName || cardholderName.length < 3) {
        throw new Error('Por favor ingresa un nombre válido');
      }
      
      // Verificar que el usuario esté autenticado
      if (!currentUser) {
        throw new Error('Debes iniciar sesión para completar la compra');
      }
      
      // Simulación de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        // Update user's plan in Firestore
        const now = new Date();
        const expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
        
        // Intento 1: Actualizar el documento del usuario
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            planId,
            planName,
            planPurchasedAt: now,
            planExpiresAt: expiresAt
          });
          console.log('Plan de usuario actualizado correctamente');
        } catch (firebaseError) {
          console.warn('No se pudo actualizar el plan del usuario:', firebaseError);
          // Continuamos con el flujo a pesar del error para pruebas
        }
        
        // Intento 2: Guardar el registro de pago
        try {
          await setDoc(doc(db, 'payments', `${currentUser.uid}_${now.getTime()}`), {
            userId: currentUser.uid,
            planId,
            planName,
            amount,
            currency: 'USD',
            status: 'succeeded',
            provider: 'stripe',
            stripePaymentIntentId: 'pi_simulated_test_' + Date.now(),
            createdAt: now,
            expiresAt
          });
          console.log('Registro de pago guardado correctamente');
        } catch (firebaseError) {
          console.warn('No se pudo guardar el registro de pago:', firebaseError);
          // Continuamos con el flujo a pesar del error para pruebas
        }
      } catch (dbError) {
        console.error('Error de Firebase:', dbError);
        // Para pruebas, continuamos con el flujo a pesar del error de Firebase
      }
      
      toast.success('Pago realizado con éxito');
      navigate('/payment-success');
    } catch (error: any) {
      console.error('Error procesando el pago:', error);
      setPaymentError(error.message || 'Hubo un error al procesar tu pago. Por favor intenta de nuevo.');
      toast.error('Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="bg-blue-50 p-3 rounded-md mb-4 border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>MODO DE PRUEBA</strong>: Puedes usar la tarjeta 4242 4242 4242 4242 con cualquier fecha futura y CVC.
        </p>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Pagar con Tarjeta</h2>
      <p className="text-gray-600 mb-6">
        Estás adquiriendo: <span className="font-medium">{planName}</span>
        <br />
        Precio: <span className="font-medium">${amount / 100}</span>
      </p>
      
      <div className="mb-4">
        <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del titular
        </label>
        <input
          id="cardholderName"
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
          placeholder="Nombre como aparece en la tarjeta"
          required
        />
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 border border-gray-300 rounded-md">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        
        {paymentError && (
          <div className="text-red-500 text-sm">{paymentError}</div>
        )}
        
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
            isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#91c26a] hover:bg-[#82b35b]'
          }`}
        >
          {isProcessing ? 'Procesando...' : 'Pagar Ahora'}
        </button>
      </form>
    </div>
  );
};

export default StripeCheckout;

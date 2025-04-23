import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

interface PayPalCheckoutProps {
  planId: string;
  planName: string;
  amount: number; // amount in dollars
  duration: number; // duration in days
}

const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({ planId, planName, amount, duration }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSuccess = async (details: any) => {
    try {
      if (!currentUser) {
        toast.error('Debes iniciar sesión para completar la compra');
        return;
      }

      // Update user's plan in Firestore
      const now = new Date();
      const expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        planId,
        planName,
        planPurchasedAt: now,
        planExpiresAt: expiresAt
      });
      
      // Save payment record
      await setDoc(doc(db, 'payments', `${currentUser.uid}_${now.getTime()}`), {
        userId: currentUser.uid,
        planId,
        planName,
        amount,
        currency: 'USD',
        status: 'succeeded',
        provider: 'paypal',
        paypalOrderId: details.id,
        paypalPayerId: details.payer.payer_id,
        createdAt: now,
        expiresAt
      });
      
      toast.success('Pago realizado con éxito');
      navigate('/payment-success');
    } catch (error: any) {
      console.error('Error procesando el pago:', error);
      toast.error('Error al procesar el pago');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Pagar con PayPal</h2>
      <p className="text-gray-600 mb-6">
        Estás adquiriendo: <span className="font-medium">{planName}</span>
        <br />
        Precio: <span className="font-medium">${amount}</span>
      </p>
      
      <PayPalScriptProvider options={{ 
        clientId: "AeO5LsOk2UdD9WA_TwAVkKLqQBsgOuwgRrNlh21QkCAaM2Uv00jcU9B1GTYcgP8zHxQcJNWH84pKTqzl", 
        currency: "USD",
        intent: "capture"
      }}>
        <PayPalButtons
          style={{ layout: "vertical" }}
          createOrder={(_, actions) => {
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  amount: {
                    currency_code: "USD",
                    value: amount.toString(),
                  },
                  description: `Plan: ${planName}`
                },
              ],
            });
          }}
          onApprove={(_, actions) => {
            return actions.order!.capture().then((details) => {
              handleSuccess(details);
            });
          }}
          onError={(err) => {
            console.error('PayPal Error:', err);
            toast.error('Error al procesar el pago con PayPal');
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
};

export default PayPalCheckout;

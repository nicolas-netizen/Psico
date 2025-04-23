import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [planInfo, setPlanInfo] = React.useState<{ name: string, expiresAt: Date } | null>(null);

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.planName && userData.planExpiresAt) {
            setPlanInfo({
              name: userData.planName,
              expiresAt: userData.planExpiresAt.toDate()
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user plan:', error);
      }
    };

    fetchUserPlan();
  }, [currentUser, navigate]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Pago Exitoso!</h1>
        
        <p className="text-lg text-gray-700 mb-6">
          Tu pago ha sido procesado correctamente y tu suscripción ha sido activada.
        </p>
        
        {planInfo && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h2 className="font-semibold text-lg text-gray-800 mb-2">Detalles de tu plan</h2>
            <p className="text-gray-700">
              <span className="font-medium">Plan: </span>{planInfo.name}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Válido hasta: </span>
              {planInfo.expiresAt.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-[#91c26a] hover:bg-[#82b35b] text-white font-medium rounded-lg transition-colors"
          >
            Ir al Dashboard
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

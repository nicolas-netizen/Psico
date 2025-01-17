import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-hot-toast';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

const PlanList: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansSnapshot = await getDocs(collection(db, 'plans'));
        console.log('Planes encontrados:', plansSnapshot.docs.length);
        const plansData = plansSnapshot.docs.map(doc => {
          console.log('Plan data:', doc.data());
          return {
            id: doc.id,
            ...doc.data()
          };
        }) as Plan[];
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

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para seleccionar un plan');
      return;
    }

    try {
      // Crear un nuevo userPlan en Firestore
      await addDoc(collection(db, 'userPlans'), {
        userId: user.uid,
        planId: planId,
        active: true,
        startDate: Timestamp.now(),
        endDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 30 días
      });

      toast.success('Plan activado correctamente');
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast.error('Error al seleccionar el plan');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-12">Nuestros Planes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h3>
              <p className="text-gray-600 mb-6">{plan.description}</p>
              <div className="text-3xl font-bold text-blue-600 mb-6">
                ${plan.price}
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <svg 
                      className="w-5 h-5 text-green-500 mr-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelectPlan(plan.id)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300"
              >
                Seleccionar Plan
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanList;

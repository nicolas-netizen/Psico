import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-hot-toast';
import { CheckCircle2, Star } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  recommended?: boolean;
  featured?: boolean;
}

interface PlanListProps {
  hideActions?: boolean;
}

const PlanList: React.FC<PlanListProps> = ({ hideActions = false }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansRef = collection(db, 'plans');
        const snapshot = await getDocs(plansRef);
        
        const plansData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Plan[];
        
        plansData.sort((a, b) => a.price - b.price);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`
              relative bg-white rounded-2xl p-8
              transform transition-all duration-300
              ${plan.recommended 
                ? 'ring-4 ring-[#91c26a] ring-opacity-50 scale-105 shadow-xl' 
                : 'hover:shadow-xl hover:scale-102 shadow-lg'
              }
            `}
          >
            {/* Badge de Recomendado/Destacado */}
            {(plan.recommended || plan.featured) && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div 
                  className={`
                    inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold
                    ${plan.recommended 
                      ? 'bg-[#91c26a] text-white' 
                      : 'bg-[#f3f4f6] text-gray-700'
                    }
                  `}
                >
                  <Star className="w-4 h-4 mr-1" />
                  {plan.recommended ? 'Recomendado' : 'Destacado'}
                </div>
              </div>
            )}

            {/* Encabezado del Plan */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h3>
              <p className="text-gray-600 mb-6">{plan.description}</p>
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-extrabold text-[#91c26a]">
                  ${plan.price.toLocaleString()}
                </span>
                <span className="text-gray-500 ml-2">/mes</span>
              </div>
            </div>

            {/* Lista de Características */}
            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-[#91c26a] flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Botón de Acción */}
            {!hideActions && (
              <div className="mt-8">
                <button
                  className={`
                    w-full py-4 px-6 rounded-xl text-center text-base font-semibold
                    transition-all duration-300 transform
                    ${plan.recommended
                      ? 'bg-[#91c26a] text-white hover:bg-[#7ea756] hover:-translate-y-1'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 hover:-translate-y-1'
                    }
                  `}
                >
                  Comenzar Ahora
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanList;

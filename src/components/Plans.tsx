import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plan } from '../types/Plan';
import { toast } from 'react-toastify';
import { CheckCircle2, XCircle, StarIcon } from 'lucide-react';

const Plans: React.FC<{ showFeaturedOnly?: boolean }> = ({ showFeaturedOnly = false }) => {
  const { getPlans, purchasePlan, user, updateUser } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const fetchedPlans = await getPlans();
        // Filter plans if showFeaturedOnly is true
        const displayPlans = showFeaturedOnly 
          ? fetchedPlans.filter(plan => plan.recommended || plan.featured)
          : fetchedPlans;
        
        setPlans(displayPlans);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        toast.error(`No se pudieron cargar los planes: ${errorMessage}`);
        setLoading(false);
      }
    };

    fetchPlans();
  }, [showFeaturedOnly]);

  const handlePurchasePlan = async (planId: string) => {
    try {
      await purchasePlan(planId);
      toast.success('Plan comprado exitosamente');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al comprar el plan: ${errorMessage}`);
    }
  };

  if (loading) {
    return <div>Cargando planes...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Elige tu Plan</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`
              bg-white shadow-lg rounded-lg p-6 transform transition-all hover:scale-105 
              ${plan.recommended ? 'border-4 border-green-500' : ''}
              relative
            `}
          >
            {(plan.recommended || plan.featured) && (
              <div className="absolute top-0 right-0 m-2 p-1 bg-green-500 text-white rounded-full">
                <StarIcon size={20} className="text-white" />
              </div>
            )}
            <h2 className="text-2xl font-semibold mb-4">
              {plan.name}
              {plan.recommended && (
                <span className="ml-2 text-sm text-green-600 font-normal">
                  (Recomendado)
                </span>
              )}
            </h2>
            <p className="text-gray-600 mb-4">{plan.description}</p>
            <div className="text-3xl font-bold mb-4">
              ${plan.price}/mes
            </div>
            <ul className="mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center mb-2">
                  <CheckCircle2 className="text-green-500 mr-2" size={20} />
                  {feature}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => handlePurchasePlan(plan.id)}
              className={`
                w-full py-2 rounded-lg transition-colors 
                ${user?.subscription?.planId === plan.id 
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
                }
              `}
              disabled={user?.subscription?.planId === plan.id}
            >
              {user?.subscription?.planId === plan.id ? 'Plan Actual' : 'Comprar Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Plans;

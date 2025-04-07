import React from 'react';
import { Check, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  popular?: boolean;
  type: 'free' | 'basic' | 'premium';
}

interface PlanCardProps {
  plan: Plan;
  hideActions?: boolean;
  isLoggedIn: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, hideActions = false, isLoggedIn }) => {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-white shadow-lg transition-all duration-300 hover:shadow-xl ${
      plan.popular ? 'border-2 border-[#91c26a]' : 'border border-gray-100'
    }`}>
      {plan.popular && (
        <div className="absolute top-0 right-0 bg-[#91c26a] text-white px-4 py-1 rounded-bl-lg">
          <div className="flex items-center space-x-1">
            <Star size={16} />
            <span className="text-sm font-medium">Popular</span>
          </div>
        </div>
      )}

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        <p className="mt-2 text-gray-600">{plan.description}</p>

        <div className="mt-8">
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900">
              ${plan.price}
            </span>
            <span className="ml-2 text-gray-600">/mes</span>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <Check className="h-5 w-5 text-[#91c26a] flex-shrink-0" />
              <span className="ml-3 text-gray-600">{feature}</span>
            </div>
          ))}
        </div>

        {!hideActions && (
          <div className="mt-8">
            {isLoggedIn ? (
              <Link
                to={`/plans/${plan.id}`}
                className="block w-full text-center bg-[#91c26a] text-white py-3 px-4 rounded-lg hover:bg-[#82b35b] transition-colors duration-300"
              >
                Seleccionar Plan
              </Link>
            ) : (
              <Link
                to="/register"
                className="block w-full text-center bg-[#91c26a] text-white py-3 px-4 rounded-lg hover:bg-[#82b35b] transition-colors duration-300"
              >
                Registrarse para Comenzar
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanCard;

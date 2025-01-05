import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGlobalAuth } from '../hooks/useGlobalAuth';
import { Plan } from '../types/plan';

const Plans = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useGlobalAuth();

  // Obtener los planes del estado global (localStorage)
  const plans = JSON.parse(localStorage.getItem('plans') || '[]') as Plan[];

  const handlePlanClick = (planName: string) => {
    if (!isAuthenticated) {
      navigate('/register');
    } else {
      console.log(`Selected plan: ${planName}`);
    }
  };

  if (plans.length === 0) {
    return (
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p>No hay planes disponibles</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-12 bg-gray-50" id="planes">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`rounded-lg shadow-lg divide-y divide-gray-200 ${
                plan.recommended
                  ? 'border-2 border-[#91c26a] relative'
                  : 'border border-gray-200'
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 -translate-y-1/2 px-3 py-1 bg-[#91c26a] text-white text-sm font-medium rounded-full transform translate-x-2">
                  Más popular
                </div>
              )}
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900">{plan.name}</h2>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-base font-medium text-gray-500">/mes</span>
                </p>
                <button
                  onClick={() => handlePlanClick(plan.name)}
                  className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium ${
                    plan.recommended
                      ? 'bg-[#91c26a] text-white hover:bg-[#82b35b]'
                      : 'bg-[#91c26a] bg-opacity-10 text-[#91c26a] hover:bg-opacity-20'
                  } transition-colors duration-200`}
                >
                  Empezar Ahora
                </button>
              </div>
              <div className="pt-6 pb-8 px-6">
                <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">
                  ¿Qué está incluido?
                </h3>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex space-x-3">
                      <CheckCircle2 
                        className={`flex-shrink-0 h-5 w-5 ${
                          plan.recommended ? 'text-[#91c26a]' : 'text-[#91c26a]'
                        }`}
                      />
                      <span className="text-base text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Plans;

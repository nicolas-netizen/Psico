import React, { useState, useEffect } from 'react';
import { Plan, getPlans } from '../services/firestore';
import { Check } from 'lucide-react';

const Precios: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const fetchedPlans = await getPlans();
        setPlans(fetchedPlans);
      } catch (error) {
        console.error('Error loading plans:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="py-24 bg-white sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Precios</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Planes para cada necesidad
          </p>
        </div>
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10 ${
                plan.isFeatured ? 'ring-2 ring-blue-600 scale-105' : ''
              }`}
            >
              <div>
                {plan.isFeatured && (
                  <div className="mb-4 rounded-full bg-blue-500 px-3 py-1 text-sm font-semibold text-white inline-block">
                    Recomendado
                  </div>
                )}
                <div className="flex items-center justify-between gap-x-4">
                  <h3 className="text-lg font-semibold leading-8 text-gray-900">
                    {plan.name}
                  </h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {plan.description}
                </p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm font-semibold leading-6 text-gray-600">/mes</span>
                  )}
                </p>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none text-blue-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="#"
                className={`mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  plan.isFeatured
                    ? 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:outline-blue-600'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                Comenzar ahora
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Precios;

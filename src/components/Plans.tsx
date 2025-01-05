import React from 'react';
import { Check } from 'lucide-react';

const Plans = () => {
  const plans = [
    {
      name: 'Plan Básico',
      price: '29.99€',
      period: '/mes',
      features: [
        'Acceso a tests básicos',
        'Seguimiento de progreso',
        'Recursos de estudio',
        'Soporte por email'
      ],
      image: '/images/basic-plan.jpg'
    },
    {
      name: 'Plan Premium',
      price: '49.99€',
      period: '/mes',
      features: [
        'Todos los tests disponibles',
        'Seguimiento personalizado',
        'Recursos avanzados',
        'Soporte prioritario',
        'Simulacros de examen'
      ],
      recommended: true,
      image: '/images/premium-plan.jpg'
    },
    {
      name: 'Plan Anual',
      price: '399.99€',
      period: '/año',
      features: [
        'Todos los beneficios Premium',
        'Ahorro de 200€',
        'Acceso a seminarios',
        'Mentorías personalizadas',
        'Garantía de aprobado'
      ],
      image: '/images/annual-plan.jpg'
    }
  ];

  return (
    <section className="py-16 bg-gray-50" id="planes">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Planes de Preparación
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades y comienza tu preparación hoy mismo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={"bg-white rounded-xl shadow-lg overflow-hidden " + 
                (plan.recommended ? 'ring-2 ring-[#91c26a]' : '')}
            >
              {/* Plan Image */}
              <div className="h-48 bg-gray-200">
                {/* Add image here when available */}
              </div>

              {/* Plan Content */}
              <div className="p-6">
                {plan.recommended && (
                  <div className="text-[#91c26a] text-sm font-semibold mb-2">
                    Recomendado
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-gray-500 ml-1">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-[#91c26a] mr-2" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={
                  plan.recommended
                    ? "w-full py-3 px-4 rounded-lg font-semibold bg-[#91c26a] text-white hover:bg-[#82b35b] transition-colors"
                    : "w-full py-3 px-4 rounded-lg font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors"
                }>
                  Comenzar Ahora
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Plans;

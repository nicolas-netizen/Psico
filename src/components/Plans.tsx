import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Award, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  recommended?: boolean;
  featured?: boolean;
}

interface PlansProps {
  hideActions?: boolean;
}

const Plans: React.FC<PlansProps> = ({ hideActions = false }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const handlePurchase = (planId: string) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    // Implementar lógica de compra
    console.log('Comprando plan:', planId);
  };

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Plan Básico',
      price: 1999,
      description: 'Ideal para comenzar tu preparación',
      features: [
        'Acceso a tests básicos',
        'Material de estudio fundamental',
        'Seguimiento básico de progreso',
        'Soporte por email'
      ]
    },
    {
      id: 'pro',
      name: 'Plan Profesional',
      price: 3999,
      description: 'La mejor opción para la mayoría',
      features: [
        'Todo lo del Plan Básico',
        'Tests avanzados y especializados',
        'Material de estudio completo',
        'Seguimiento detallado',
        'Soporte prioritario',
        'Sesiones grupales de práctica'
      ],
      recommended: true
    },
    {
      id: 'premium',
      name: 'Plan Premium',
      price: 5999,
      description: 'Preparación intensiva y personalizada',
      features: [
        'Todo lo del Plan Profesional',
        'Tests exclusivos premium',
        'Material especializado',
        'Mentoría personalizada',
        'Soporte 24/7',
        'Sesiones privadas de práctica',
        'Garantía de aprobación'
      ],
      featured: true
    }
  ];

  return (
    <motion.div
      className="py-16 bg-gradient-to-br from-[#F5F7FA] via-white to-[#f0f7eb]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center mb-16">
          <motion.h2 
            className="text-4xl font-bold text-gray-900 mb-4"
            variants={itemVariants}
          >
            Planes diseñados para tu éxito
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Elige el plan que mejor se adapte a tus necesidades y comienza tu preparación hoy mismo.
          </motion.p>
        </div>

        {/* Grid de planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              className={`
                relative bg-white rounded-2xl shadow-lg overflow-hidden
                ${plan.recommended ? 'ring-2 ring-[#91c26a] scale-105 z-10' : ''}
                hover:shadow-xl transition-all duration-300
              `}
              variants={itemVariants}
            >
              {/* Badge de recomendado/destacado */}
              {(plan.recommended || plan.featured) && (
                <div className={`
                  absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium
                  ${plan.recommended ? 'bg-[#91c26a] text-white' : 'bg-yellow-400 text-gray-900'}
                `}>
                  {plan.recommended && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>Recomendado</span>
                    </div>
                  )}
                  {plan.featured && (
                    <div className="flex items-center space-x-1">
                      <Award className="w-4 h-4" />
                      <span>Destacado</span>
                    </div>
                  )}
                </div>
              )}

              {/* Contenido del plan */}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <div className="flex items-baseline mb-8">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600 ml-2">/mes</span>
                </div>

                {/* Lista de características */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-[#91c26a] mt-0.5 flex-shrink-0" />
                      <span className="ml-3 text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Botón de acción */}
                {!hideActions && (
                  <motion.button
                    onClick={() => handlePurchase(plan.id)}
                    className={`
                      w-full py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2
                      ${plan.recommended || plan.featured
                        ? 'bg-gradient-to-r from-[#91c26a] to-[#6ea844] text-white hover:shadow-lg'
                        : 'bg-white text-[#91c26a] border-2 border-[#91c26a] hover:bg-[#f0f7eb]'
                      }
                      transition-all duration-300 hover:scale-105
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Comenzar Ahora</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Nota adicional */}
        <motion.p 
          className="text-center text-gray-600 mt-8"
          variants={itemVariants}
        >
          ¿Necesitas un plan personalizado? <button className="text-[#91c26a] font-medium hover:underline">Contáctanos</button>
        </motion.p>
      </div>
    </motion.div>
  );
};

export default Plans;

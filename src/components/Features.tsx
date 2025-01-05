import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, Award, Clock, Users, Sparkles } from 'lucide-react';
import FadeInView from './animations/FadeInView';

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: 'Tests Especializados',
      description: 'Ejercicios diseñados específicamente para cada tipo de prueba psicotécnica.',
      color: 'bg-blue-50'
    },
    {
      icon: Target,
      title: 'Análisis de Progreso',
      description: 'Estadísticas detalladas para identificar tus fortalezas y áreas de mejora.',
      color: 'bg-green-50'
    },
    {
      icon: Clock,
      title: 'Práctica Cronometrada',
      description: 'Simulaciones reales para mejorar tu velocidad y precisión.',
      color: 'bg-yellow-50'
    },
    {
      icon: Users,
      title: 'Apoyo Continuo',
      description: 'Acceso a tutores expertos y una comunidad de estudiantes.',
      color: 'bg-purple-50'
    },
    {
      icon: Award,
      title: 'Método Verificado',
      description: 'Sistema de estudio avalado por miles de aprobados.',
      color: 'bg-red-50'
    },
    {
      icon: Sparkles,
      title: 'Recursos Dinámicos',
      description: 'Material en constante actualización según las últimas convocatorias.',
      color: 'bg-indigo-50'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInView>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ventajas que nos distinguen
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Todo lo que necesitas para alcanzar tu meta en un solo lugar
            </p>
          </div>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FadeInView key={index} delay={index * 0.1}>
              <motion.div
                className={"p-6 rounded-xl " + feature.color + " hover:scale-105 transition-transform cursor-pointer"}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <feature.icon className="w-12 h-12 text-[#91c26a] mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            </FadeInView>
          ))}
        </div>

        <FadeInView delay={0.4}>
          <div className="mt-16 text-center">
            <motion.button
              className="px-8 py-4 bg-[#91c26a] text-white rounded-lg font-semibold shadow-lg hover:bg-[#82b35b] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Empezar Ahora
            </motion.button>
          </div>
        </FadeInView>
      </div>
    </section>
  );
};

export default Features;

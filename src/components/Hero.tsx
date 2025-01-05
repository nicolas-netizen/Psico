import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, Award } from 'lucide-react';

const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <div className="pt-24 pb-16 bg-gradient-to-b from-[#F5F7FA] to-white overflow-hidden">
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center" variants={itemVariants}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 font-outfit mb-6">
            Tu éxito en psicotécnicos
            <br />
            <span className="text-[#91c26a]">comienza aquí.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            La plataforma líder en preparación de tests psicotécnicos. Metodología probada, material actualizado y seguimiento personalizado.
          </p>
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-4"
            variants={itemVariants}
          >
            <motion.button
              className="px-8 py-4 bg-[#91c26a] text-white rounded-lg font-semibold shadow-lg hover:bg-[#82b35b] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Prueba Gratis
            </motion.button>
            <motion.button
              className="px-8 py-4 bg-white text-[#91c26a] border-2 border-[#91c26a] rounded-lg font-semibold hover:bg-[#f0f7eb] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Ver Planes
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div 
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
        >
          {[
            {
              icon: Brain,
              title: 'Material Exclusivo',
              description: 'Tests actualizados y exclusivos para cada tipo de oposición'
            },
            {
              icon: Target,
              title: 'Seguimiento Personal',
              description: 'Análisis detallado de tu rendimiento y áreas de mejora'
            },
            {
              icon: Award,
              title: 'Resultados Probados',
              description: 'Más del 90% de nuestros alumnos aprueban en primera convocatoria'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all"
              variants={itemVariants}
              whileHover={{ 
                y: -5,
                boxShadow: '0 10px 30px -15px rgba(0,0,0,0.1)'
              }}
            >
              <feature.icon className="w-12 h-12 text-[#91c26a] mb-4" />
              <h3 className="text-xl font-semibold mb-2 font-outfit">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Hero;
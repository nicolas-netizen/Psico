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
    <div className="pt-24 pb-16 bg-gradient-to-br from-[#F5F7FA] via-white to-[#f0f7eb] overflow-hidden relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#91c26a] rounded-full filter blur-3xl opacity-20"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#91c26a] rounded-full filter blur-3xl opacity-20"></div>
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center" variants={itemVariants}>
          <motion.div
            className="inline-block mb-8 p-4 rounded-2xl bg-white/50 backdrop-blur-sm shadow-xl"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
          >
            <img 
              src="/Logo.png" 
              alt="Logo" 
              className="h-24 w-auto object-contain filter brightness-100 contrast-125" 
              style={{ maxWidth: '200px' }}
            />
          </motion.div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 font-outfit mb-6 tracking-tight">
            Tu éxito en psicotécnicos
            <br />
            <span className="bg-gradient-to-r from-[#91c26a] to-[#6ea844] bg-clip-text text-transparent">comienza aquí.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            La plataforma líder en preparación de tests psicotécnicos. Metodología probada, material actualizado y seguimiento personalizado.
          </p>
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-4"
            variants={itemVariants}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-[#91c26a] to-[#6ea844] text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Prueba Gratis
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-[#91c26a] border-2 border-[#91c26a] rounded-lg font-semibold hover:bg-[#f0f7eb] transition-colors"
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
              title: 'Metodología Probada',
              description: 'Nuestro sistema de aprendizaje está diseñado para maximizar tu rendimiento.'
            },
            {
              icon: Target,
              title: 'Práctica Dirigida',
              description: 'Tests personalizados que se adaptan a tu nivel y necesidades específicas.'
            },
            {
              icon: Award,
              title: 'Resultados Garantizados',
              description: 'Miles de estudiantes han alcanzado sus metas con nuestro método.'
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
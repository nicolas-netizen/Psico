import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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

  const features = [
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
  ];

  return (
    <div className="pt-28 pb-20 bg-gradient-to-br from-[#F5F7FA] via-white to-[#f0f7eb] overflow-hidden relative">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#91c26a]/20 via-transparent to-[#6ea844]/20 backdrop-blur-3xl" />
      </div>
      
      {/* Círculos decorativos */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#91c26a] rounded-full filter blur-3xl opacity-10 animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#91c26a] rounded-full filter blur-3xl opacity-10 animate-pulse" />
      
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center" variants={itemVariants}>
          {/* Logo animado */}
          <motion.div
            className="inline-block mb-12 p-6 rounded-3xl bg-white/80 backdrop-blur-sm shadow-2xl"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
          >
            <img 
              src="/Logo.png" 
              alt="Logo" 
              className="h-28 w-auto object-contain filter brightness-105 contrast-125" 
              style={{ maxWidth: '240px' }}
            />
          </motion.div>

          {/* Título principal */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 font-outfit mb-8 tracking-tight leading-tight">
            Tu éxito en psicotécnicos
            <br />
            <span className="bg-gradient-to-r from-[#91c26a] to-[#6ea844] bg-clip-text text-transparent">
              comienza aquí
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            La plataforma líder en preparación de tests psicotécnicos. 
            <br className="hidden sm:block" />
            Metodología probada, material actualizado y seguimiento personalizado.
          </p>

          {/* Botones de acción */}
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-6"
            variants={itemVariants}
          >
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group px-8 py-4 bg-gradient-to-r from-[#91c26a] to-[#6ea844] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Empieza Ahora</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <Link to="/plans">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-[#91c26a] border-2 border-[#91c26a] rounded-xl font-semibold hover:bg-[#f0f7eb] transition-all duration-300 hover:shadow-lg"
              >
                Ver Planes
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Características */}
        <motion.div 
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 px-4"
          variants={containerVariants}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-[#91c26a]/10 rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-[#91c26a]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Hero;
import React from 'react';
import { motion } from 'framer-motion';
import BaremoCalculator from '../components/BaremoCalculator';

const BaremoCalculatorPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      {/* Encabezado */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm"
      >
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Calculadora de Baremos
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Herramienta profesional para el cálculo preciso de baremos en evaluaciones psicológicas
          </p>
        </div>
      </motion.div>

      {/* Contenedor principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Calculadora */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 md:p-8"
          >
            <BaremoCalculator />
          </motion.div>

          {/* Información adicional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                ¿Qué son los baremos?
              </h3>
              <p className="text-gray-600">
                Los baremos son escalas de valores que se establecen para evaluar o clasificar los resultados de una prueba de acuerdo con una población de referencia.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                ¿Cómo usar la calculadora?
              </h3>
              <p className="text-gray-600">
                Ingresa los datos requeridos en los campos correspondientes y la calculadora generará automáticamente los resultados del baremo para tu evaluación.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BaremoCalculatorPage;

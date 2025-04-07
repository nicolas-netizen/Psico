import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const FloatingCTA = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000); // Mostrar después de 5 segundos

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm relative">
            <button
              onClick={() => setIsVisible(false)}
              className="absolute -top-2 -right-2 bg-gray-100 rounded-full p-1 hover:bg-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¿Listo para empezar?
            </h3>
            <p className="text-gray-600 mb-4">
              Regístrate ahora y obtén acceso a tu primera prueba gratuita.
            </p>
            
            <Link
              to="/register"
              className="block w-full text-center bg-[#91c26a] text-white py-2 px-4 rounded-lg hover:bg-[#82b35b] transition-colors"
            >
              Comenzar Gratis
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingCTA;

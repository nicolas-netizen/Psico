import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Efecto para manejar la redirección cuando cambia isAdmin
    if (!loading) {
      if (isAdmin) {
        navigate('/admin');
        toast.success('Bienvenido, administrador');
      }
    }
  }, [isAdmin, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Por favor, complete todos los campos');
      }

      await login(email, password);
      if (!isAdmin) {
        navigate('/dashboard');
        toast.success('Inicio de sesión exitoso');
      }
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      let errorMessage = 'Error al iniciar sesión. Por favor, verifica tus credenciales.';
      
      // Mensajes de error personalizados
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este correo electrónico.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Por favor, intente más tarde.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e9f5db] via-white to-[#e9f5db] p-4"
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#91c26a]/10 to-transparent" />
        
        <div className="relative">
          {/* Icono y título */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#91c26a]/20 mb-4">
              <GraduationCap className="w-8 h-8 text-[#91c26a]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Iniciar sesión</h1>
            <p className="text-gray-600 mt-2">Ingresa tus credenciales para continuar</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Correo electrónico */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#91c26a]/50 focus:border-[#91c26a] transition-colors"
                placeholder="nombre@ejemplo.com"
                required
              />
            </motion.div>

            {/* Contraseña */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#91c26a]/50 focus:border-[#91c26a] transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </motion.div>

            {/* Botón de inicio de sesión */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300
                ${loading 
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#91c26a] to-[#82b35b] hover:from-[#82b35b] hover:to-[#73a44c] shadow-md hover:shadow-lg'
                }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar sesión'
              )}
            </motion.button>
          </form>

          {/* Enlaces */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-6 space-y-4"
          >
            <div className="text-center">
              <Link to="/reset-password" className="text-sm text-[#91c26a] hover:text-[#82b35b]">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="text-center text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="text-[#91c26a] hover:text-[#82b35b] font-medium">
                Regístrate aquí
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Login;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { GraduationCap } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const userRole = await login(email, password);
      toast.success('¡Inicio de sesión exitoso!');
      
      // Redirigir según el rol del usuario
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      toast.error('Error al iniciar sesión. Por favor, verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#f0f7eb] to-[#e8f5e3] py-8">
      <div className="w-full max-w-md px-8 py-6 bg-white rounded-2xl shadow-xl mx-4">
        <div className="flex flex-col items-center">
          <div className="bg-[#91c26a]/10 p-3 rounded-full">
            <GraduationCap className="h-12 w-12 text-[#91c26a]" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            ¡Bienvenido de nuevo!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Accede a tu cuenta para continuar
          </p>
        </div>
        
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-[#91c26a] focus:border-transparent
                transition-all duration-200"
                placeholder="nombre@ejemplo.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-[#91c26a] focus:border-transparent
                transition-all duration-200"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#91c26a] focus:ring-[#91c26a] border-gray-300 rounded
                transition-colors duration-200"
              />
              <label htmlFor="remember-me" className="ml-2 text-gray-600">
                Recordarme
              </label>
            </div>

            <button
              type="button"
              className="font-medium text-[#91c26a] hover:text-[#7ea756] transition-colors duration-200"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white 
            bg-[#91c26a] hover:bg-[#7ea756] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#91c26a]
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">¿No tienes una cuenta? </span>
          <button
            onClick={() => navigate('/register')}
            className="font-medium text-[#91c26a] hover:text-[#7ea756] transition-colors duration-200"
          >
            Regístrate aquí
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

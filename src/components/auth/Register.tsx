import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { GraduationCap } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      await register(email, password);
      toast.success('¡Registro exitoso!');
      navigate('/dashboard');
    } catch (error: any) {
      let errorMessage = 'Error al registrar usuario';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo ya está registrado';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#f0f7eb] to-[#e8f5e3] py-4">
      <div className="w-full max-w-md px-6 py-4 bg-white rounded-2xl shadow-xl mx-4 mb-0">
        <div className="flex flex-col items-center">
          <div className="bg-[#91c26a]/10 p-2 rounded-full">
            <GraduationCap className="h-10 w-10 text-[#91c26a]" />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-gray-900">
            Crear una cuenta
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Únete a nuestra comunidad
          </p>
        </div>
        
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
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
                className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-[#91c26a] focus:border-transparent
                transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirmar contraseña
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-[#91c26a] focus:border-transparent
                transition-all duration-200"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-[#91c26a] focus:ring-[#91c26a] border-gray-300 rounded
              transition-colors duration-200"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
              Acepto los términos y condiciones
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white 
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
              'Crear cuenta'
            )}
          </button>
        </form>

        <div className="mt-3 text-center text-sm">
          <span className="text-gray-600">¿Ya tienes una cuenta? </span>
          <button
            onClick={() => navigate('/login')}
            className="font-medium text-[#91c26a] hover:text-[#7ea756] transition-colors duration-200"
          >
            Inicia sesión aquí
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;

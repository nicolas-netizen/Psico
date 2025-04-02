import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { GraduationCap } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await resetPassword(email);
      toast.success('Se ha enviado un correo para restablecer tu contraseña');
      navigate('/login');
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      toast.error('Error al enviar el correo de restablecimiento');
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
            Restablecer contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ingresa tu correo electrónico y te enviaremos las instrucciones
          </p>
        </div>
        
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
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
              'Enviar instrucciones'
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-[#91c26a] hover:text-[#7ea756] font-medium"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  confirmPasswordReset, 
  verifyPasswordResetCode, 
  applyActionCode,
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';
import { KeyRound, ArrowLeft, Eye, EyeOff, Mail } from 'lucide-react';

const FirebaseAction = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  useEffect(() => {
    const handleAction = async () => {
      if (!oobCode) {
        setError('Código de acción no válido');
        setLoading(false);
        return;
      }

      try {
        if (mode === 'resetPassword') {
          const email = await verifyPasswordResetCode(auth, oobCode);
          setEmail(email);
        } else if (mode === 'verifyEmail') {
          await applyActionCode(auth, oobCode);
          setVerificationSuccess(true);
        } else {
          setError('Modo de acción no válido');
        }
      } catch (error) {
        setError('El enlace ha expirado o no es válido');
      } finally {
        setLoading(false);
      }
    };

    handleAction();
  }, [oobCode, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      if (!oobCode) throw new Error('Código no válido');
      
      await confirmPasswordReset(auth, oobCode, password);
      toast.success('Contraseña actualizada exitosamente');
      navigate('/login');
    } catch (error) {
      setError('Error al restablecer la contraseña. Por favor, intente nuevamente');
    }
  };

  const handleBack = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleBack}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-xl hover:bg-green-600 transition-all transform hover:scale-105 duration-200 font-medium"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (verificationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">¡Email Verificado!</h2>
            <p className="text-gray-600 mb-6">Tu correo electrónico ha sido verificado exitosamente.</p>
            <button
              onClick={handleBack}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-xl hover:bg-green-600 transition-all transform hover:scale-105 duration-200 font-medium"
            >
              Ir al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'resetPassword') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full relative">
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 text-gray-600 hover:text-green-600 transition-colors"
            title="Volver"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="text-center mb-8">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Restablecer Contraseña</h2>
            <p className="text-gray-600 mt-2">{email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform hover:scale-105 duration-200"
            >
              Cambiar Contraseña
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default FirebaseAction;

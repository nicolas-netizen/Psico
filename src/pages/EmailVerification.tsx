import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const EmailVerification = () => {
  const { currentUser, sendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.emailVerified) {
      navigate('/dashboard');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser, navigate]);

  useEffect(() => {
    const checkVerification = setInterval(async () => {
      if (currentUser) {
        await currentUser.reload();
        if (currentUser.emailVerified) {
          toast.success('¡Email verificado exitosamente!');
          navigate('/dashboard');
        }
      }
    }, 3000);

    return () => clearInterval(checkVerification);
  }, [currentUser, navigate]);

  const handleResendEmail = async () => {
    if (!canResend) return;
    
    try {
      await sendVerificationEmail();
      toast.success('Email de verificación enviado');
      setTimeLeft(60);
      setCanResend(false);
    } catch (error) {
      toast.error('Error al enviar el email de verificación');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verifica tu email
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              Hemos enviado un email de verificación a{' '}
              <span className="font-medium text-[#91c26a]">
                {currentUser?.email}
              </span>
            </p>

            <p className="text-sm text-gray-500 mb-8">
              Por favor, revisa tu bandeja de entrada y sigue las instrucciones para verificar tu cuenta.
            </p>

            <button
              onClick={handleResendEmail}
              disabled={!canResend}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${canResend 
                  ? 'bg-[#91c26a] hover:bg-[#82b35b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#91c26a]' 
                  : 'bg-gray-300 cursor-not-allowed'}`}
            >
              {canResend 
                ? 'Reenviar email de verificación' 
                : `Reenviar en ${timeLeft}s`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;

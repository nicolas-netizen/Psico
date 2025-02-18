import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="AcademiaChapiri"
              className="h-8 w-auto"
            />
            <nav className="hidden md:flex ml-10 space-x-8">
              <a
                href="/dashboard"
                className="text-gray-900 hover:text-[#91c26a] px-3 py-2 text-sm font-medium"
              >
                Inicio
              </a>
              <a
                href="/calculator"
                className="text-gray-900 hover:text-[#91c26a] px-3 py-2 text-sm font-medium"
              >
                Calculadora de Baremo
              </a>
              <a
                href="/plans"
                className="text-gray-900 hover:text-[#91c26a] px-3 py-2 text-sm font-medium"
              >
                Planes
              </a>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">{currentUser?.email}</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent 
                       text-sm font-medium rounded-md text-gray-700 hover:text-[#91c26a] 
                       focus:outline-none transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

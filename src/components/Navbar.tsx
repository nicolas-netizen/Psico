import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useGlobalAuth } from '../hooks/useGlobalAuth';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, userRole, userEmail, logout } = useGlobalAuth();
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
    setIsOpen(false);
  };

  const handleRegisterClick = () => {
    navigate('/register');
    setIsOpen(false);
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold text-[#91c26a]">
              AcademiaChapiri
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="text-gray-700 hover:text-[#91c26a] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Inicio
              </Link>
              <Link
                to="/precios"
                className="text-gray-700 hover:text-[#91c26a] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Precios
              </Link>
              <Link
                to="/recursos"
                className="text-gray-700 hover:text-[#91c26a] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Recursos
              </Link>
            </div>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleDashboardClick}
                  className="text-gray-700 hover:text-[#91c26a] px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <User className="h-4 w-4 mr-2" />
                  {userRole === 'admin' ? 'Panel Admin' : 'Mi Panel'}
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLoginClick}
                  className="text-gray-600 hover:text-[#91c26a] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={handleRegisterClick}
                  className="bg-[#91c26a] text-white hover:bg-[#82b35b] px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Registrarse
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#91c26a]"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="text-gray-700 hover:text-[#91c26a] block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Inicio
            </Link>
            <Link
              to="/precios"
              onClick={() => setIsOpen(false)}
              className="text-gray-700 hover:text-[#91c26a] block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Precios
            </Link>
            <Link
              to="/recursos"
              onClick={() => setIsOpen(false)}
              className="text-gray-700 hover:text-[#91c26a] block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Recursos
            </Link>
            
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 text-sm text-gray-500">
                  {userEmail}
                </div>
                <button
                  onClick={handleDashboardClick}
                  className="text-gray-700 hover:text-[#91c26a] w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center"
                >
                  <User className="h-4 w-4 mr-2" />
                  {userRole === 'admin' ? 'Panel Admin' : 'Mi Panel'}
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white hover:bg-red-600 w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors mt-2"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleLoginClick}
                  className="text-gray-700 hover:text-[#91c26a] w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={handleRegisterClick}
                  className="bg-[#91c26a] text-white hover:bg-[#82b35b] w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors mt-2"
                >
                  Registrarse
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
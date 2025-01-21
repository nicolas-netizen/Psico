import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser: user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada exitosamente');
      navigate('/');
      setIsOpen(false);
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-2xl font-bold text-[#91c26a] hover:text-[#7ea756] transition-colors">
              <GraduationCap className="h-8 w-8" />
              <span>AcademiaChapiri</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="text-gray-700 hover:text-[#91c26a] px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                Inicio
              </Link>
              <Link
                to="/recursos"
                className="text-gray-700 hover:text-[#91c26a] px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                Recursos
              </Link>
              {user && (
                <>
                  {isAdmin ? (
                    <Link
                      to="/admin"
                      className="text-gray-700 hover:text-[#91c26a] px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105"
                    >
                      Panel Admin
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      className="text-gray-700 hover:text-[#91c26a] px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105"
                    >
                      Mi Panel
                    </Link>
                  )}
                  <Link
                    to="/plans"
                    className="text-gray-700 hover:text-[#91c26a] px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105"
                  >
                    Planes
                  </Link>
                </>
              )}
            </div>
            
            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-[#91c26a]/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-[#91c26a]" />
                    </div>
                    <span className="text-gray-700 text-sm">{user.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-[#91c26a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#7ea756] transition-all duration-300 hover:scale-105 hover:shadow-md"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-[#91c26a] px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    className="bg-[#91c26a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#7ea756] transition-all duration-300 hover:scale-105 hover:shadow-md"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-[#91c26a] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#91c26a] transition-colors"
            >
              <span className="sr-only">Abrir menú principal</span>
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 bg-white/90 backdrop-blur-md shadow-lg rounded-b-2xl border-t border-gray-100">
          <div className="px-4 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#91c26a] hover:bg-gray-50 transition-colors"
            >
              Inicio
            </Link>
            <Link
              to="/recursos"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#91c26a] hover:bg-gray-50 transition-colors"
            >
              Recursos
            </Link>
            {user && (
              <>
                {isAdmin ? (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#91c26a] hover:bg-gray-50 transition-colors"
                  >
                    Panel Admin
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#91c26a] hover:bg-gray-50 transition-colors"
                  >
                    Mi Panel
                  </Link>
                )}
                <Link
                  to="/plans"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#91c26a] hover:bg-gray-50 transition-colors"
                >
                  Planes
                </Link>
              </>
            )}
            {user ? (
              <div className="px-3 py-3 border-t border-gray-100 mt-2">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-8 w-8 rounded-full bg-[#91c26a]/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-[#91c26a]" />
                  </div>
                  <span className="text-gray-700 text-sm">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full bg-[#91c26a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#7ea756] transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="px-3 py-3 border-t border-gray-100 mt-2 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-[#91c26a] hover:bg-gray-50 transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center bg-[#91c26a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#7ea756] transition-colors"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
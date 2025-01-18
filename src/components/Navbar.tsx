import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
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
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
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
              {user && (
                <>
                  {isAdmin ? (
                    <Link
                      to="/admin"
                      className="text-gray-700 hover:text-[#91c26a] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Panel Admin
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      className="text-gray-700 hover:text-[#91c26a] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Mi Panel
                    </Link>
                  )}
                  <Link
                    to="/plans"
                    className="text-gray-700 hover:text-[#91c26a] px-3 py-2 rounded-md text-sm font-medium transition-colors"
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
                  <span className="text-gray-700 text-sm">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-[#91c26a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#7ea756] transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-[#91c26a] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    className="bg-[#91c26a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#7ea756] transition-colors"
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
            {user && (
              <>
                {isAdmin ? (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-700 hover:text-[#91c26a] block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    Panel Admin
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-700 hover:text-[#91c26a] block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    Mi Panel
                  </Link>
                )}
                <Link
                  to="/plans"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-700 hover:text-[#91c26a] block px-3 py-2 rounded-md text-base font-medium transition-colors"
                >
                  Planes
                </Link>
              </>
            )}
            {user ? (
              <>
                <div className="px-3 py-2">
                  <span className="text-gray-700 text-sm block mb-2">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="w-full bg-[#91c26a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#7ea756] transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-700 hover:text-[#91c26a] block px-3 py-2 rounded-md text-base font-medium transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2"
                >
                  <span className="bg-[#91c26a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#7ea756] transition-colors block text-center">
                    Registrarse
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, User, LogIn } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button 
              className="p-2 rounded-md text-gray-600 lg:hidden hover:bg-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu size={24} />
            </button>
            <Link to="/" className="ml-4 flex items-center">
              <span className="text-2xl font-bold text-[#91c26a] hover:text-[#82b35b] transition-colors">
                Academia Chapiri
              </span>
            </Link>
          </div>
          
          <div className="hidden lg:flex lg:items-center lg:space-x-8">
            <Link
              to="/"
              className={`${isActive('/') ? 'text-[#91c26a] font-medium' : 'text-gray-600 hover:text-[#91c26a]'} transition-colors`}
            >
              Inicio
            </Link>
            <Link
              to="/recursos"
              className={`${isActive('/recursos') ? 'text-[#91c26a] font-medium' : 'text-gray-600 hover:text-[#91c26a]'} transition-colors`}
            >
              Recursos
            </Link>
            <Link
              to="/precios"
              className={`${isActive('/precios') ? 'text-[#91c26a] font-medium' : 'text-gray-600 hover:text-[#91c26a]'} transition-colors`}
            >
              Precios
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <button className="hidden lg:flex items-center px-4 py-2 text-[#91c26a] hover:bg-[#f0f7eb] rounded-lg transition-colors">
              <LogIn className="w-4 h-4 mr-2" />
              Acceder
            </button>
            <button className="flex items-center px-4 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b] transition-colors">
              Prueba Gratis
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className={`block px-3 py-2 rounded-md ${isActive('/') ? 'bg-[#f0f7eb] text-[#91c26a] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-[#91c26a]'}`}
              >
                Inicio
              </Link>
              <Link
                to="/recursos"
                className={`block px-3 py-2 rounded-md ${isActive('/recursos') ? 'bg-[#f0f7eb] text-[#91c26a] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-[#91c26a]'}`}
              >
                Recursos
              </Link>
              <Link
                to="/precios"
                className={`block px-3 py-2 rounded-md ${isActive('/precios') ? 'bg-[#f0f7eb] text-[#91c26a] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-[#91c26a]'}`}
              >
                Precios
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
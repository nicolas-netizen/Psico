import React from 'react';
import { Menu, User, LogIn } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button className="p-2 rounded-md text-gray-600 lg:hidden">
              <Menu size={24} />
            </button>
            <div className="ml-4 flex items-center">
              <span className="text-2xl font-bold text-[#2D5BFF]">PsicoTests</span>
            </div>
          </div>
          
          <div className="hidden lg:flex lg:items-center lg:space-x-8">
            <a href="#" className="text-gray-600 hover:text-[#2D5BFF] transition-colors">
              Inicio
            </a>
            <a href="#" className="text-gray-600 hover:text-[#2D5BFF] transition-colors">
              Tests
            </a>
            <a href="#" className="text-gray-600 hover:text-[#2D5BFF] transition-colors">
              Recursos
            </a>
            <a href="#" className="text-gray-600 hover:text-[#2D5BFF] transition-colors">
              Precios
            </a>
          </div>

          <div className="flex items-center space-x-4">
            <button className="hidden lg:flex items-center px-4 py-2 text-[#2D5BFF] hover:bg-blue-50 rounded-lg transition-colors">
              <LogIn className="w-4 h-4 mr-2" />
              Acceder
            </button>
            <button className="flex items-center px-4 py-2 bg-[#2D5BFF] text-white rounded-lg hover:bg-blue-600 transition-colors">
              Prueba Gratis
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
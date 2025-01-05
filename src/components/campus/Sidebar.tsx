import React from 'react';
import { User, BarChart2, BookOpen, Home } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 fixed left-0 top-0">
      <div className="p-4">
        <div className="text-xl font-bold text-[#91c26a] mb-8">Academia Chapiri</div>
        
        <nav className="space-y-2">
          <a
            href="#"
            className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Home className="w-5 h-5" />
            <span>Inicio</span>
          </a>
          
          <a
            href="#"
            className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <User className="w-5 h-5" />
            <span>Mi Perfil</span>
          </a>
          
          <a
            href="#"
            className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <BarChart2 className="w-5 h-5" />
            <span>Estadísticas</span>
          </a>
          
          <a
            href="#"
            className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <BookOpen className="w-5 h-5" />
            <span>Tests</span>
          </a>
        </nav>
      </div>
      
      {/* User Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200"></div>
          <div>
            <div className="font-medium">Usuario</div>
            <div className="text-sm text-gray-500">Plan Premium</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

import React from 'react';
import { Users, BookOpen, Trophy } from 'lucide-react';

const Stats = () => {
  return (
    <div className="py-16 bg-[#2D5BFF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white text-center">
          <div>
            <Users className="w-12 h-12 mx-auto mb-4" />
            <div className="text-4xl font-bold mb-2">50,000+</div>
            <div className="text-blue-100">Estudiantes Activos</div>
          </div>
          <div>
            <BookOpen className="w-12 h-12 mx-auto mb-4" />
            <div className="text-4xl font-bold mb-2">10,000+</div>
            <div className="text-blue-100">Tests Disponibles</div>
          </div>
          <div>
            <Trophy className="w-12 h-12 mx-auto mb-4" />
            <div className="text-4xl font-bold mb-2">95%</div>
            <div className="text-blue-100">Tasa de Aprobados</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
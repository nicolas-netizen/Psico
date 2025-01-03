import React from 'react';
import { Brain, Target, Award } from 'lucide-react';

const Hero = () => {
  return (
    <div className="pt-24 pb-16 bg-gradient-to-b from-[#F5F7FA] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 font-outfit mb-6">
            Domina los tests psicotécnicos.
            <br />
            <span className="text-[#2D5BFF]">Aprueba tu oposición.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Prepárate con miles de tests personalizados, análisis detallado y seguimiento en tiempo real.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-8 py-4 bg-[#2D5BFF] text-white rounded-lg hover:bg-blue-600 transition-colors text-lg font-semibold">
              Prueba Gratis
            </button>
            <button className="px-8 py-4 bg-white text-[#2D5BFF] border-2 border-[#2D5BFF] rounded-lg hover:bg-blue-50 transition-colors text-lg font-semibold">
              Ver Planes
            </button>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Brain,
              title: 'Tests Personalizados',
              description: 'Adaptados a tu nivel y objetivos específicos'
            },
            {
              icon: Target,
              title: 'Análisis en Tiempo Real',
              description: 'Seguimiento detallado de tu progreso'
            },
            {
              icon: Award,
              title: 'Garantía de Éxito',
              description: '95% de aprobados en la primera convocatoria'
            }
          ].map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <feature.icon className="w-12 h-12 text-[#2D5BFF] mb-4" />
              <h3 className="text-xl font-semibold mb-2 font-outfit">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
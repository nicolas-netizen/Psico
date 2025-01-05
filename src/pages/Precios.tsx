import React from 'react';
import Plans from '../components/Plans';

const Precios = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F7FA] via-white to-[#f0f7eb] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nuestros Planes
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades y comienza tu viaje hacia el éxito profesional
          </p>
        </div>
        
        <Plans showFeaturedOnly={false} />
      </div>
    </div>
  );
};

export default Precios;

import React from 'react';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import Features from '../components/Features';
import Testimonials from '../components/Testimonials';
import PlanList from '../components/plans/PlanList';

const Home = () => {
  return (
    <div className="bg-gradient-to-b from-white to-[#f8faf6]">
      <Hero />
      
      {/* Sección de Estadísticas con fondo suave */}
      <div className="bg-gradient-to-r from-[#f0f7eb] to-[#e8f5e3]">
        <Stats />
      </div>
      
      {/* Características con fondo blanco */}
      <div className="bg-white py-16">
        <Features />
      </div>
      
      {/* Testimonios con fondo suave */}
      <div className="bg-gradient-to-br from-[#f5f7fa] to-[#f0f7eb] py-16">
        <Testimonials />
      </div>
      
      {/* Sección de Planes Destacados */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Planes Diseñados para Ti
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre nuestros planes más populares y encuentra el que mejor se adapte a tus necesidades.
              Cada plan está cuidadosamente diseñado para ayudarte en tu desarrollo profesional.
            </p>
          </div>
          
          <PlanList hideActions={true} />
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6">
              ¿Quieres ver todos nuestros planes y sus beneficios completos?
            </p>
            <a 
              href="/plans" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#91c26a] hover:bg-[#7ea756] transition-colors duration-300"
            >
              Ver Todos los Planes
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

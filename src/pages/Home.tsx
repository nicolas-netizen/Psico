import React from 'react';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import Features from '../components/Features';
import Testimonials from '../components/Testimonials';
import Plans from '../components/Plans';
import BaremoCalculator from '../components/BaremoCalculator';

const Home = () => {
  return (
    <>
      <Hero />
      <Stats />
      <Features />
      <Testimonials />
      
      {/* Sección de Planes Destacados */}
      <section className="py-16 bg-gradient-to-br from-[#F5F7FA] via-white to-[#f0f7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Planes Destacados
            </h2>
            <p className="text-xl text-gray-600">
              Descubre nuestros planes más populares y encuentra el que mejor se adapte a ti
            </p>
          </div>
          
          <Plans showFeaturedOnly={true} />
        </div>
      </section>
      
      <BaremoCalculator />
    </>
  );
};

export default Home;

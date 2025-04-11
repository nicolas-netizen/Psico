import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import FloatingCTA from '../components/FloatingCTA';
import TestAnimation from '../components/TestAnimation';

// Lazy load de componentes secundarios
const Stats = lazy(() => import('../components/Stats'));
const Features = lazy(() => import('../components/Features'));
const Testimonials = lazy(() => import('../components/Testimonials'));
const PlanList = lazy(() => import('../components/admin/PlansManager'));
const WhyChooseUs = lazy(() => import('../components/WhyChooseUs'));

// Componente de carga
const LoadingComponent = () => (
  <div className="flex justify-center items-center py-12">
    <div className="w-8 h-8 border-4 border-[#91c26a] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Hero />
      
      {/* Test Animation Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Experimenta Nuestros Tests
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Prueba un ejemplo de nuestros tests psicotécnicos interactivos
            </p>
          </div>
          <TestAnimation />
        </div>
      </section>

      {/* Por qué elegirnos */}
      <Suspense fallback={<LoadingComponent />}>
        <WhyChooseUs />
      </Suspense>
      
      {/* Sección de Estadísticas con fondo suave */}
      <div className="bg-[#f0f7eb]">
        <Suspense fallback={<LoadingComponent />}>
          <Stats />
        </Suspense>
      </div>
      
      {/* Características con fondo blanco */}
      <div className="bg-white py-16">
        <Suspense fallback={<LoadingComponent />}>
          <Features />
        </Suspense>
      </div>
      
      {/* Testimonios con fondo suave */}
      <div className="bg-[#f5f7fa] py-16">
        <Suspense fallback={<LoadingComponent />}>
          <Testimonials />
        </Suspense>
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
          
          <Suspense fallback={<LoadingComponent />}>
            <PlanList hideActions={true} maxPlans={3} />
          </Suspense>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6">
              ¿Quieres ver todos nuestros planes y sus beneficios completos?
            </p>
            <Link 
              to="/plans" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#91c26a] hover:bg-[#7ea756] transition-colors duration-300"
            >
              Ver Todos los Planes
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Flotante */}
      <Suspense fallback={null}>
        <FloatingCTA />
      </Suspense>
    </div>
  );
};

export default Home;

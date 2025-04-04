import { Brain, Target, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  const features = [
    {
      icon: Brain,
      title: 'Metodología Probada',
      description: 'Nuestro sistema de aprendizaje está diseñado para maximizar tu rendimiento.'
    },
    {
      icon: Target,
      title: 'Práctica Dirigida',
      description: 'Tests personalizados que se adaptan a tu nivel y necesidades específicas.'
    },
    {
      icon: Award,
      title: 'Resultados Garantizados',
      description: 'Miles de estudiantes han alcanzado sus metas con nuestro método.'
    }
  ];

  return (
    <div className="pt-28 pb-20 bg-gradient-to-br from-[#F5F7FA] to-[#f0f7eb] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center">
          <div className="inline-block mb-12 p-6 rounded-3xl bg-white shadow-lg">
            <img 
              src="/Logo.png" 
              alt="Academia Chapiri" 
              width="240"
              height="112"
              className="h-28 w-auto object-contain" 
              loading="eager"
            />
          </div>

          {/* Título principal */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 font-outfit mb-8 tracking-tight leading-tight">
            Tu éxito en psicotécnicos
            <br />
            <span className="bg-gradient-to-r from-[#91c26a] to-[#6ea844] bg-clip-text text-transparent">
              comienza aquí
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            La plataforma líder en preparación de tests psicotécnicos. 
            <br className="hidden sm:block" />
            Metodología probada, material actualizado y seguimiento personalizado.
          </p>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/register">
              <button className="group px-8 py-4 bg-[#91c26a] text-white rounded-xl font-semibold shadow-lg hover:bg-[#82b35b] transition-colors duration-300 flex items-center justify-center space-x-2">
                <span>Empieza Ahora</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link to="/plans">
              <button className="px-8 py-4 bg-white text-[#91c26a] border-2 border-[#91c26a] rounded-xl font-semibold hover:bg-[#f0f7eb] transition-colors duration-300">
                Ver Planes
              </button>
            </Link>
          </div>
        </div>

        {/* Características */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="w-12 h-12 bg-[#91c26a]/10 rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-[#91c26a]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
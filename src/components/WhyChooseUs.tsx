import { CheckCircle2, Users, Clock, BarChart3, BookOpen, Shield } from 'lucide-react';

const WhyChooseUs = () => {
  const reasons = [
    {
      icon: Users,
      title: 'Comunidad Activa',
      description: 'Únete a miles de estudiantes que comparten tu objetivo.'
    },
    {
      icon: Clock,
      title: 'Acceso 24/7',
      description: 'Practica cuando quieras, donde quieras, sin limitaciones.'
    },
    {
      icon: BarChart3,
      title: 'Análisis Detallado',
      description: 'Recibe informes detallados de tu rendimiento y progreso.'
    },
    {
      icon: BookOpen,
      title: 'Material Actualizado',
      description: 'Contenido constantemente actualizado por expertos.'
    },
    {
      icon: Shield,
      title: 'Garantía de Calidad',
      description: 'Satisfacción garantizada o te devolvemos tu dinero.'
    },
    {
      icon: CheckCircle2,
      title: 'Soporte Premium',
      description: 'Asistencia personalizada cuando la necesites.'
    }
  ];

  return (
    <section className="py-20 bg-[#f8faf6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            ¿Por Qué Elegirnos?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre por qué miles de estudiantes confían en nosotros para su preparación
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#91c26a]/10 rounded-lg flex items-center justify-center">
                    <reason.icon className="w-6 h-6 text-[#91c26a]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {reason.title}
                  </h3>
                  <p className="text-gray-600">
                    {reason.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;

import React from 'react';
import { Book, Video, Download, FileText } from 'lucide-react';

const Resources = () => {
  const resources = [
    {
      title: 'Guías de Estudio',
      description: 'Material didáctico organizado por bloques temáticos',
      icon: Book,
      items: [
        'Guía completa de razonamiento verbal',
        'Manual de razonamiento numérico',
        'Técnicas de memoria y concentración',
        'Estrategias para tests psicotécnicos'
      ]
    },
    {
      title: 'Videotutoriales',
      description: 'Explicaciones detalladas en formato video',
      icon: Video,
      items: [
        'Introducción a los tests psicotécnicos',
        'Resolución de ejercicios paso a paso',
        'Técnicas avanzadas de resolución',
        'Consejos para el día del examen'
      ]
    },
    {
      title: 'Material Descargable',
      description: 'Recursos para practicar offline',
      icon: Download,
      items: [
        'Tests en formato PDF',
        'Plantillas de respuestas',
        'Ejercicios extra',
        'Resúmenes temáticos'
      ]
    },
    {
      title: 'Documentación',
      description: 'Información detallada sobre el proceso',
      icon: FileText,
      items: [
        'Guía del proceso de oposición',
        'Calendario de convocatorias',
        'Requisitos y documentación',
        'Preguntas frecuentes'
      ]
    }
  ];

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Recursos de Preparación
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Todo el material necesario para tu preparación, organizado y actualizado regularmente
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {resources.map((resource, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-center mb-4">
                <resource.icon className="w-8 h-8 text-[#91c26a] mr-3" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {resource.title}
                  </h3>
                  <p className="text-gray-600">{resource.description}</p>
                </div>
              </div>
              <ul className="space-y-3 ml-11">
                {resource.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="text-gray-700 hover:text-[#91c26a] cursor-pointer transition-colors"
                  >
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg">
            <button className="px-6 py-2 bg-[#91c26a] text-white rounded-md shadow-sm hover:bg-[#82b35b] transition-colors">
              Acceder al Campus
            </button>
            <span className="px-4 text-gray-600">o</span>
            <button className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors">
              Ver Planes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;

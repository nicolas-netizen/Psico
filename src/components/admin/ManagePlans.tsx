import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

const ManagePlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: '1',
      name: 'Plan Básico',
      description: 'Ideal para comenzar',
      price: 200,
      features: ['Resultados inmediatos', 'Reportes básicos']
    },
    {
      id: '2',
      name: 'Plan Profesional',
      description: 'Para profesionales y estudiantes avanzados',
      price: 2999,
      features: [
        'Todos los tests disponibles',
        'Resultados detallados',
        'Reportes avanzados',
        'Análisis comparativo',
        'Soporte prioritario'
      ]
    }
  ]);

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-gray-50 pt-8">
      <div className="max-w-7xl mx-auto px-6 pb-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Planes</h1>
          <button
            className="flex items-center justify-center px-6 py-3 bg-[#4285f4] text-white text-base font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200"
            onClick={() => {/* Implementar creación de plan */}}
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Crear Plan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600 mt-1">{plan.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    onClick={() => {/* Implementar edición */}}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    onClick={() => {/* Implementar eliminación */}}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">${plan.price}</p>
              </div>

              <div className="mt-4 space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagePlans;

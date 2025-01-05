import React, { useState } from 'react';
import { Book, Clock, Award, Settings } from 'lucide-react';
import { useGlobalAuth } from '../../hooks/useGlobalAuth';
import AdminDashboard from '../../pages/AdminDashboard';

const UserDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tests');
  const { userRole, userEmail } = useGlobalAuth();
  const userPlan = localStorage.getItem('userPlan') || 'basic';

  // Si el usuario es admin, mostrar el panel de administración
  if (userRole === 'admin') {
    return <AdminDashboard />;
  }

  const testHistory = [
    {
      id: 1,
      name: 'Test de Personalidad',
      category: 'Psicología',
      date: '2024-01-04',
      score: 85,
    },
    {
      id: 2,
      name: 'Test de Aptitud',
      category: 'Profesional',
      date: '2024-01-03',
      score: 92,
    },
  ];

  const availableTests = [
    {
      id: 1,
      name: 'Test de Personalidad',
      category: 'Psicología',
      difficulty: 'Intermedio',
      duration: '30 min',
      requiredPlan: 'basic',
    },
    {
      id: 2,
      name: 'Test de Aptitud',
      category: 'Profesional',
      difficulty: 'Avanzado',
      duration: '45 min',
      requiredPlan: 'premium',
    },
  ];

  const canAccessTest = (requiredPlan: string) => {
    if (requiredPlan === 'basic') return true;
    if (requiredPlan === 'premium' && userPlan === 'premium') return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Panel</h1>
          <p className="mt-2 text-gray-600">
            Bienvenido, {userEmail}
          </p>
          <div className="mt-4 inline-block px-4 py-2 bg-[#91c26a] bg-opacity-10 rounded-full text-[#6ea844] font-medium">
            {userPlan === 'premium' ? 'Plan Premium' : 'Plan Básico'}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              className={`pb-4 px-1 ${
                activeTab === 'tests'
                  ? 'border-b-2 border-[#91c26a] text-[#91c26a]'
                  : 'text-gray-500 hover:text-gray-700'
              } font-medium flex items-center space-x-2`}
              onClick={() => setActiveTab('tests')}
            >
              <Book className="h-5 w-5" />
              <span>Tests Disponibles</span>
            </button>
            <button
              className={`pb-4 px-1 ${
                activeTab === 'history'
                  ? 'border-b-2 border-[#91c26a] text-[#91c26a]'
                  : 'text-gray-500 hover:text-gray-700'
              } font-medium flex items-center space-x-2`}
              onClick={() => setActiveTab('history')}
            >
              <Clock className="h-5 w-5" />
              <span>Historial</span>
            </button>
            <button
              className={`pb-4 px-1 ${
                activeTab === 'progress'
                  ? 'border-b-2 border-[#91c26a] text-[#91c26a]'
                  : 'text-gray-500 hover:text-gray-700'
              } font-medium flex items-center space-x-2`}
              onClick={() => setActiveTab('progress')}
            >
              <Award className="h-5 w-5" />
              <span>Progreso</span>
            </button>
            <button
              className={`pb-4 px-1 ${
                activeTab === 'settings'
                  ? 'border-b-2 border-[#91c26a] text-[#91c26a]'
                  : 'text-gray-500 hover:text-gray-700'
              } font-medium flex items-center space-x-2`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="h-5 w-5" />
              <span>Configuración</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {activeTab === 'tests' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Tests Disponibles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableTests.map((test) => (
                  <div
                    key={test.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{test.name}</h3>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        Categoría: {test.category}
                      </p>
                      <p className="text-sm text-gray-600">
                        Dificultad: {test.difficulty}
                      </p>
                      <p className="text-sm text-gray-600">
                        Duración: {test.duration}
                      </p>
                    </div>
                    <button
                      className={`w-full py-2 px-4 rounded-lg font-medium ${
                        canAccessTest(test.requiredPlan)
                          ? 'bg-gradient-to-r from-[#91c26a] to-[#6ea844] text-white hover:shadow-md'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      } transition-all`}
                      disabled={!canAccessTest(test.requiredPlan)}
                    >
                      {canAccessTest(test.requiredPlan) ? 'Comenzar Test' : 'Requiere Plan Premium'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Historial de Tests</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre del Test
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Puntuación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {testHistory.map((test) => (
                      <tr key={test.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {test.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {test.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {test.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-sm text-[#6ea844] bg-[#91c26a] bg-opacity-10 rounded-full">
                            {test.score}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Mi Progreso</h2>
              <p className="text-gray-600">Función en desarrollo...</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Configuración</h2>
              <p className="text-gray-600">Función en desarrollo...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

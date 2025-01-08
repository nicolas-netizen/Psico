import React, { useState, useEffect } from 'react';
import { Book, Clock, Award, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from '../../pages/AdminDashboard';
import api from '../../services/api';
import { Test } from '../../types/Test';
import { Plan } from '../../types/Plan';

const UserDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tests');
  const { user, isAuthenticated } = useAuth();
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [userPlan, setUserPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const fetchUserPlanDetails = async () => {
      try {
        // Fetch user's plan details
        if (user?.subscription?.planId) {
          const planDetails = await api.getPlanById(user.subscription.planId);
          setUserPlan(planDetails);
        }
      } catch (error) {
        console.error('Error fetching plan details:', error);
      }
    };

    const fetchTestsAndHistory = async () => {
      try {
        // Fetch tests for the user's plan
        const planTests = await api.getTestsByPlan(user?.subscription?.planId || 'plan-1');
        console.log('Dashboard Available Tests:', planTests);
        setAvailableTests(planTests);

        // Fetch user's test history
        const history = await api.getUserTestHistory(user?.id);
        console.log('Dashboard Test History:', history);
        setTestHistory(history);
      } catch (error) {
        console.error('Error fetching tests:', error);
      }
    };

    if (user?.id) {
      fetchUserPlanDetails();
      fetchTestsAndHistory();
    }
  }, [user?.id, user?.subscription?.planId]);

  // Si el usuario es admin, mostrar el panel de administración
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  const canAccessTest = (testPlans: string[] | undefined) => {
    if (!userPlan) return false;

    // If test has no plan restrictions, allow access
    if (!testPlans || testPlans.length === 0) return true;

    // Check if user's plan matches any of the test's plans
    return testPlans.some(planId => 
      planId === user?.subscription?.planId || 
      (userPlan.name.toLowerCase() === 'god' && planId.includes('plan-'))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Panel</h1>
          <p className="mt-2 text-gray-600">
            Bienvenido, {user?.name || user?.email}
          </p>
          <div className="mt-4 inline-block px-4 py-2 bg-[#91c26a] bg-opacity-10 rounded-full text-[#6ea844] font-medium">
            {userPlan?.name || 'Plan no definido'}
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
              {availableTests.length === 0 ? (
                <p className="text-gray-500">No hay tests disponibles para tu plan.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableTests.map((test) => (
                    <div
                      key={test.id}
                      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                    >
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{test.title}</h3>
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">
                          Categoría: {test.category || 'No especificada'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Dificultad: {test.difficulty || 'No especificada'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Duración: {test.timeLimit || 30} min
                        </p>
                      </div>
                      <button
                        className={`w-full py-2 px-4 rounded-lg font-medium ${
                          canAccessTest(test.plans)
                            ? 'bg-gradient-to-r from-[#91c26a] to-[#6ea844] text-white hover:shadow-md'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        } transition-all`}
                        disabled={!canAccessTest(test.plans)}
                      >
                        {canAccessTest(test.plans) ? 'Comenzar Test' : 'No disponible para tu plan'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Historial de Tests</h2>
              {testHistory.length === 0 ? (
                <p className="text-gray-500">No tienes historial de tests.</p>
              ) : (
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {test.score}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

import React from 'react';
import { BarChart, Users, FileText, Settings } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm h-screen fixed">
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-800 font-outfit">Admin Panel</h2>
          </div>
          <nav className="mt-4">
            <a
              href="#"
              className="flex items-center px-4 py-2 text-gray-700 bg-gray-50 border-l-4 border-primary"
            >
              <BarChart className="w-5 h-5 mr-3" />
              Dashboard
            </a>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <FileText className="w-5 h-5 mr-3" />
              Tests
            </a>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Users className="w-5 h-5 mr-3" />
              Usuarios
            </a>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Settings className="w-5 h-5 mr-3" />
              Configuración
            </a>
          </nav>
        </div>

        {/* Main content */}
        <div className="ml-64 flex-1 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Tests</h3>
              <p className="text-3xl font-bold text-primary">156</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Usuarios Activos</h3>
              <p className="text-3xl font-bold text-primary">2,847</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Tests Completados</h3>
              <p className="text-3xl font-bold text-primary">12,456</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Tasa de Aprobados</h3>
              <p className="text-3xl font-bold text-primary">95%</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-4">Tests Recientes</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preguntas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    {
                      title: 'Razonamiento Abstracto - Nivel 1',
                      category: 'Abstracto',
                      questions: 30,
                      status: 'Publicado'
                    },
                    {
                      title: 'Series Numéricas Avanzadas',
                      category: 'Numérico',
                      questions: 25,
                      status: 'Borrador'
                    }
                  ].map((test, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {test.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {test.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {test.questions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          test.status === 'Publicado'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {test.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
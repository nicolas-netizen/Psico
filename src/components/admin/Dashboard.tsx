import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Settings, BarChart3, PlusCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const userEmail = localStorage.getItem('userEmail') || '';

  // Datos de ejemplo para el dashboard
  const stats = {
    totalUsers: 156,
    activeTests: 12,
    completedTests: 458,
    averageScore: 75
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="mt-1 text-sm text-gray-500">
                Bienvenido, {userEmail}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#91c26a] to-[#6ea844] hover:shadow-lg transition-all duration-300"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Crear Test
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-[#91c26a]" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Usuarios Totales</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.totalUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-[#91c26a]" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Tests Activos</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.activeTests}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-[#91c26a]" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Tests Completados</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.completedTests}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Settings className="h-6 w-6 text-[#91c26a]" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Puntuación Promedio</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.averageScore}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow rounded-lg">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-[#91c26a] text-[#91c26a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Vista General
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`${
                  activeTab === 'users'
                    ? 'border-[#91c26a] text-[#91c26a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Usuarios
              </button>
              <button
                onClick={() => setActiveTab('tests')}
                className={`${
                  activeTab === 'tests'
                    ? 'border-[#91c26a] text-[#91c26a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Tests
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`${
                  activeTab === 'create'
                    ? 'border-[#91c26a] text-[#91c26a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Crear Test
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Resumen de Actividad</h3>
                <p className="text-gray-500">
                  Panel en desarrollo. Aquí se mostrarán gráficos y estadísticas detalladas.
                </p>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Gestión de Usuarios</h3>
                <p className="text-gray-500">
                  Panel en desarrollo. Aquí se mostrará la lista de usuarios y sus detalles.
                </p>
              </div>
            )}

            {activeTab === 'tests' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Tests Disponibles</h3>
                <p className="text-gray-500">
                  Panel en desarrollo. Aquí se mostrarán todos los tests creados y sus estadísticas.
                </p>
              </div>
            )}

            {activeTab === 'create' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Crear Nuevo Test</h3>
                {/* Aquí iría el formulario de creación de test */}
                <form className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Título del Test
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                      placeholder="Ej: Test de Aptitud Verbal"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Descripción
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                      placeholder="Describe el propósito y contenido del test"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Categoría
                      </label>
                      <select
                        id="category"
                        name="category"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                      >
                        <option>Psicotécnico</option>
                        <option>Aptitud Verbal</option>
                        <option>Razonamiento Lógico</option>
                        <option>Matemáticas</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                        Dificultad
                      </label>
                      <select
                        id="difficulty"
                        name="difficulty"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                      >
                        <option>Fácil</option>
                        <option>Medio</option>
                        <option>Difícil</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="plan" className="block text-sm font-medium text-gray-700">
                      Plan Requerido
                    </label>
                    <select
                      id="plan"
                      name="plan"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                    >
                      <option value="basic">Básico</option>
                      <option value="premium">Premium</option>
                      <option value="annual">Anual</option>
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#91c26a] to-[#6ea844] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#91c26a] transition-all duration-300"
                    >
                      Crear Test
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

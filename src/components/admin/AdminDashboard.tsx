import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminStats, getAllUsers } from '../../services/firestore';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-hot-toast';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTests: number;
  completionRate: number;
}

interface User {
  id: string;
  email: string;
  displayName: string;
  lastActive: Date;
  testsCompleted: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [testStats, setTestStats] = useState({
    totalUsers: 0,
    totalTests: 0,
    totalResults: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, usersData] = await Promise.all([
          getAdminStats(),
          getAllUsers()
        ]);
        setStats(statsData);
        setUsers(usersData);

        // Fetch users count
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersCount = usersSnapshot.size;

        // Fetch tests count
        const testsSnapshot = await getDocs(collection(db, 'tests'));
        const testsCount = testsSnapshot.size;

        // Fetch results count
        const resultsSnapshot = await getDocs(collection(db, 'testResults'));
        const resultsCount = resultsSnapshot.size;

        setTestStats({
          totalUsers: usersCount,
          totalTests: testsCount,
          totalResults: resultsCount
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateTest = () => {
    navigate('/admin/tests/create');
  };

  const handleManagePlans = () => {
    navigate('/admin/planes');
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-gray-50 pt-8">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600">Bienvenido, {user?.email}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Usuarios Activos</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{stats?.activeUsers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tests Realizados</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{stats?.totalTests || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tasa de Finalización</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{stats ? `${Math.round(stats.completionRate)}%` : '0%'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700">Total Usuarios</h3>
            <p className="text-3xl font-bold text-blue-600">{testStats.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700">Total Tests</h3>
            <p className="text-3xl font-bold text-green-600">{testStats.totalTests}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700">Total Resultados</h3>
            <p className="text-3xl font-bold text-purple-600">{testStats.totalResults}</p>
          </div>
        </div>

        {/* Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Gestión de Tests</h3>
            <p className="text-gray-600 mb-4">Crea y administra los tests de aptitud</p>
            <button
              onClick={handleCreateTest}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Crear Nuevo Test
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Gestión de Planes</h3>
            <p className="text-gray-600 mb-4">Administra los planes disponibles</p>
            <button
              onClick={handleManagePlans}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Gestionar Planes
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Usuarios Recientes</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {users.map((user) => (
              <div key={user.id} className="px-6 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-medium">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900">{user.displayName || 'Sin nombre'}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="ml-auto flex items-center space-x-4">
                    <span className="text-sm text-gray-500">{user.testsCompleted} tests completados</span>
                    <span className="text-sm text-gray-500">
                      Última actividad: {user.lastActive.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Acciones Rápidas</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link
                to="/admin/planes"
                className="flex items-center justify-center px-6 py-3 bg-[#4285f4] text-white text-base font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Gestionar Planes
              </Link>
              <Link
                to="/admin/tests/new"
                className="flex items-center justify-center px-6 py-3 bg-[#34A853] text-white text-base font-medium rounded-lg hover:bg-green-600 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Crear Test
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
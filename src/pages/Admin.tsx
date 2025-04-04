import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../components/admin/Dashboard';
import TestManager from '../components/admin/TestManager';
import PlansManager from '../components/admin/PlansManager';
import QuestionManager from '../components/admin/QuestionManager';
import DiscountCodeManager from '../components/admin/DiscountCodeManager';
import BaremoAdmin from './admin/BaremoAdmin';
import TestGenerator from '../components/admin/TestGenerator';
import { LogOut } from 'lucide-react';

const Admin: React.FC = () => {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAdmin) {
    return <div>No tienes acceso a esta página</div>;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'tests':
        return <TestManager />;
      case 'questions':
        return <QuestionManager />;
      case 'plans':
        return <PlansManager />;
      case 'discountCodes':
        return <DiscountCodeManager />;
      case 'baremos':
        return <BaremoAdmin />;
      case 'testGenerator':
        return <TestGenerator />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div>
      {/* Admin Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
              <span className="ml-4 px-3 py-1 bg-[#f1f7ed] text-[#91c26a] rounded-full text-sm font-medium">
                Admin
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>

          <div className="mt-2">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`${
                  activeTab === 'dashboard'
                    ? 'border-[#91c26a] text-[#91c26a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('tests')}
                className={`${
                  activeTab === 'tests'
                    ? 'border-[#91c26a] text-[#91c26a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Tests
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`${
                  activeTab === 'questions'
                    ? 'border-[#91c26a] text-[#91c26a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Preguntas
              </button>
              <button
                onClick={() => setActiveTab('testGenerator')}
                className={`${
                  activeTab === 'testGenerator'
                    ? 'border-[#91c26a] text-[#91c26a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Generador de Tests
              </button>
              <button
                onClick={() => setActiveTab('plans')}
                className={`${
                  activeTab === 'plans'
                    ? 'border-[#91c26a] text-[#91c26a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Planes
              </button>
              <button
                onClick={() => setActiveTab('discountCodes')}
                className={`${
                  activeTab === 'discountCodes'
                    ? 'border-[#91c26a] text-[#91c26a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Códigos de Descuento
              </button>
              <button
                onClick={() => setActiveTab('baremos')}
                className={`${
                  activeTab === 'baremos'
                    ? 'border-[#91c26a] text-[#91c26a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Baremos
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Admin;

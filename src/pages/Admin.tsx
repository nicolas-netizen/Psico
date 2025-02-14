import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/admin/Dashboard';
import TestManager from '../components/admin/TestManager';
import PlansManager from '../components/admin/PlansManager';
import QuestionManager from '../components/admin/QuestionManager';
import DiscountCodeManager from '../components/admin/DiscountCodeManager';
import BaremoAdmin from './admin/BaremoAdmin';

const Admin: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAdmin) {
    return <div>No tienes acceso a esta página</div>;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'tests':
        return <TestManager />;
      case 'plans':
        return <PlansManager />;
      case 'questions':
        return <QuestionManager />;
      case 'baremo':
        return <BaremoAdmin />;
      case 'discount':
        return <DiscountCodeManager />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Panel de Administración</h1>
      
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'dashboard'
                  ? 'border-b-2 border-[#91c26a] text-[#91c26a]'
                  : 'text-gray-500 hover:text-[#91c26a]'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'tests'
                  ? 'border-b-2 border-[#91c26a] text-[#91c26a]'
                  : 'text-gray-500 hover:text-[#91c26a]'
              }`}
            >
              Tests
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'questions'
                  ? 'border-b-2 border-[#91c26a] text-[#91c26a]'
                  : 'text-gray-500 hover:text-[#91c26a]'
              }`}
            >
              Preguntas
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'plans'
                  ? 'border-b-2 border-[#91c26a] text-[#91c26a]'
                  : 'text-gray-500 hover:text-[#91c26a]'
              }`}
            >
              Planes
            </button>
            <button
              onClick={() => setActiveTab('baremo')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'baremo'
                  ? 'border-b-2 border-[#91c26a] text-[#91c26a]'
                  : 'text-gray-500 hover:text-[#91c26a]'
              }`}
            >
              Baremo
            </button>
            <button
              onClick={() => setActiveTab('discount')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'discount'
                  ? 'border-b-2 border-[#91c26a] text-[#91c26a]'
                  : 'text-gray-500 hover:text-[#91c26a]'
              }`}
            >
              Códigos de Descuento
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Admin;

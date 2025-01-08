import React, { useState } from 'react';
import { Package, FileText } from 'lucide-react';
import PlansManager from '../components/admin/PlansManager';
import TestsManager from '../components/admin/TestsManager';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('plans');

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="mt-2 text-gray-600">
            Gestiona los planes y servicios de la plataforma
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('plans')}
              className={`pb-4 px-1 ${activeTab === 'plans' 
                ? 'border-b-2 border-[#91c26a] text-[#91c26a]' 
                : 'text-gray-500 hover:text-gray-700'} 
                font-medium flex items-center space-x-2`}
            >
              <Package className="h-5 w-5" />
              <span>Planes</span>
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`pb-4 px-1 ${activeTab === 'tests' 
                ? 'border-b-2 border-[#91c26a] text-[#91c26a]' 
                : 'text-gray-500 hover:text-gray-700'} 
                font-medium flex items-center space-x-2`}
            >
              <FileText className="h-5 w-5" />
              <span>Tests</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {activeTab === 'plans' ? <PlansManager /> : <TestsManager />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

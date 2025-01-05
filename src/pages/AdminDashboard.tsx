import React, { useState } from 'react';
import { Package } from 'lucide-react';
import PlansManager from '../components/admin/PlansManager';

const AdminDashboard = () => {
  const [activeTab] = useState('plans');

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
              className="pb-4 px-1 border-b-2 border-[#91c26a] text-[#91c26a] font-medium flex items-center space-x-2"
            >
              <Package className="h-5 w-5" />
              <span>Planes</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          <PlansManager />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

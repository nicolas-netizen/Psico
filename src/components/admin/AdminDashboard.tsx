import React, { useState } from 'react';
import TestsManager from './TestsManager';
import PlanManager from './PlanManager';
import { toast } from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tests' | 'plans'>('tests');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 pb-32">
        <div className="max-w-7xl mx-auto pt-12 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
            Panel de Administración
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-indigo-100">
            Gestiona los tests y planes de la plataforma
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-[-4rem]">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`${
                    activeTab === 'tests'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                >
                  Gestionar Tests
                </button>
                <button
                  onClick={() => setActiveTab('plans')}
                  className={`${
                    activeTab === 'plans'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                >
                  Gestionar Planes
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="p-6">
              {activeTab === 'tests' ? <TestsManager /> : <PlanManager />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
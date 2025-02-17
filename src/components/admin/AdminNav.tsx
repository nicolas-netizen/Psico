import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import QuestionsManager from './QuestionsManager';
import { toast } from 'react-hot-toast';
import { resetQuestions } from '../../scripts/resetQuestions';

const AdminNav: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'questions' | 'reset' | 'tests' | 'plans' | 'baremo' | 'discount'>('questions');

  const handleResetQuestions = async () => {
    try {
      await resetQuestions();
      toast.success('Preguntas reiniciadas con éxito');
    } catch (error) {
      console.error('Error resetting questions:', error);
      toast.error('Error al reiniciar las preguntas');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'questions'
                ? 'bg-[#91c26a] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Gestionar Preguntas
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'tests'
                ? 'bg-[#91c26a] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Gestión de Tests
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'plans'
                ? 'bg-[#91c26a] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Gestión de Planes
          </button>
          <button
            onClick={() => setActiveTab('baremo')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'baremo'
                ? 'bg-[#91c26a] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Gestión de Baremo
          </button>
          <button
            onClick={() => setActiveTab('discount')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'discount'
                ? 'bg-[#91c26a] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Códigos de Descuento
          </button>
          <button
            onClick={() => setActiveTab('reset')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'reset'
                ? 'bg-[#91c26a] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Reiniciar Preguntas
          </button>
        </nav>
      </div>

      {activeTab === 'questions' && <QuestionsManager />}
      {activeTab === 'tests' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Gestión de Tests</h2>
          <NavLink
            to="/admin/tests"
            className={({ isActive }) =>
              `text-sm font-medium ${
                isActive ? 'text-[#6366f1] border-b-2 border-[#6366f1]' : 'text-gray-500 hover:text-gray-700'
              } pb-2`
            }
          >
            Gestión de Tests
          </NavLink>
        </div>
      )}
      {activeTab === 'plans' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Gestión de Planes</h2>
          <NavLink
            to="/admin/plans"
            className={({ isActive }) =>
              `text-sm font-medium ${
                isActive ? 'text-[#6366f1] border-b-2 border-[#6366f1]' : 'text-gray-500 hover:text-gray-700'
              } pb-2`
            }
          >
            Gestión de Planes
          </NavLink>
        </div>
      )}
      {activeTab === 'baremo' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Gestión de Baremo</h2>
          <NavLink
            to="/admin/baremo"
            className={({ isActive }) =>
              `text-sm font-medium ${
                isActive ? 'text-[#6366f1] border-b-2 border-[#6366f1]' : 'text-gray-500 hover:text-gray-700'
              } pb-2`
            }
          >
            Gestión de Baremo
          </NavLink>
        </div>
      )}
      {activeTab === 'discount' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Códigos de Descuento</h2>
          <NavLink
            to="/admin/discount"
            className={({ isActive }) =>
              `text-sm font-medium ${
                isActive ? 'text-[#6366f1] border-b-2 border-[#6366f1]' : 'text-gray-500 hover:text-gray-700'
              } pb-2`
            }
          >
            Códigos de Descuento
          </NavLink>
        </div>
      )}
      {activeTab === 'reset' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Reiniciar Preguntas</h2>
          <p className="text-gray-600 mb-4">
            Esta acción eliminará todas las preguntas existentes y las reemplazará con un conjunto
            predefinido de preguntas. Esta acción no se puede deshacer.
          </p>
          <button
            onClick={handleResetQuestions}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reiniciar Preguntas
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminNav;

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TestsManager from '../components/admin/TestsManager';
import PlansManager from '../components/admin/PlansManager';
import DiscountCodeManager from '../components/admin/DiscountCodeManager';
import BaremoAdmin from './admin/BaremoAdmin';
import QuestionManagement from './admin/QuestionManagement';

const Admin: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Manejo de las pestañas
    const handleTabs = () => {
      const tabs = document.querySelectorAll('nav a');
      const panels = document.querySelectorAll('.p-6 > div');
      
      tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = (e.currentTarget as HTMLAnchorElement).getAttribute('href')?.substring(1);
          
          // Actualizar clases de las pestañas
          tabs.forEach(t => {
            if (t === e.currentTarget) {
              t.classList.remove('text-gray-600');
              t.classList.add('text-blue-600');
            } else {
              t.classList.remove('text-blue-600');
              t.classList.add('text-gray-600');
            }
          });
          
          // Mostrar/ocultar paneles
          panels.forEach(panel => {
            if (panel.id === targetId) {
              panel.classList.remove('hidden');
            } else {
              panel.classList.add('hidden');
            }
          });
        });
      });
    };

    handleTabs();
  }, []);

  if (!currentUser || !isAdmin) {
    return navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Panel de Administración
        </h1>

        <div className="bg-white rounded-lg shadow">
          <nav className="border-b border-gray-200">
            <ul className="flex -mb-px">
              <li className="mr-1">
                <a
                  href="#tests"
                  className="bg-white inline-block py-2 px-4 text-blue-600 font-semibold"
                >
                  Gestión de Tests
                </a>
              </li>
              <li className="mr-1">
                <a
                  href="#questions"
                  className="bg-white inline-block py-2 px-4 text-gray-600 hover:text-blue-600 font-semibold"
                >
                  Gestión de Preguntas
                </a>
              </li>
              <li className="mr-1">
                <a
                  href="#plans"
                  className="bg-white inline-block py-2 px-4 text-gray-600 hover:text-blue-600 font-semibold"
                >
                  Gestión de Planes
                </a>
              </li>
              <li className="mr-1">
                <a
                  href="#baremo"
                  className="bg-white inline-block py-2 px-4 text-gray-600 hover:text-blue-600 font-semibold"
                >
                  Gestión de Baremo
                </a>
              </li>
              <li className="mr-1">
                <a
                  href="#discount"
                  className="bg-white inline-block py-2 px-4 text-gray-600 hover:text-blue-600 font-semibold"
                >
                  Códigos de Descuento
                </a>
              </li>
            </ul>
          </nav>

          <div className="p-6">
            <div id="tests">
              <TestsManager />
            </div>
            <div id="questions" className="hidden">
              <QuestionManagement />
            </div>
            <div id="plans" className="hidden">
              <PlansManager />
            </div>
            <div id="baremo" className="hidden">
              <BaremoAdmin />
            </div>
            <div id="discount" className="hidden">
              <DiscountCodeManager />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;

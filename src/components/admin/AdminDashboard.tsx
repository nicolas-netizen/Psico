import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import TestManagement from './TestManagement';
import QuestionManagement from './QuestionManagement';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const AdminDashboard = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const tabs = [
    { name: 'Gestión de Tests', component: <TestManagement /> },
    { name: 'Gestión de Preguntas', component: <QuestionManagement /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Panel de Administración
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona los tests y preguntas del sistema
          </p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <Tab.List className="flex space-x-1 rounded-t-lg border-b p-1">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 focus:outline-none focus:ring-2',
                      selected
                        ? 'bg-[#91c26a] text-white shadow'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )
                  }
                >
                  {tab.name}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="p-6">
              {tabs.map((tab, idx) => (
                <Tab.Panel
                  key={idx}
                  className={classNames(
                    'rounded-xl focus:outline-none'
                  )}
                >
                  {tab.component}
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
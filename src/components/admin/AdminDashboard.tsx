import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import TestsManager from './TestsManager';
import PlanManager from './PlanManager';
import DiscountCodeManager from './DiscountCodeManager';
import BaremoAdmin from '../../pages/admin/BaremoAdmin';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const AdminDashboard = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const tabs = [
    { name: 'Gestión de Tests', component: <TestsManager /> },
    { name: 'Gestión de Planes', component: <PlanManager /> },
    { name: 'Gestión de Baremo', component: <BaremoAdmin /> },
    { name: 'Códigos de Descuento', component: <DiscountCodeManager /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-indigo-600 pb-32">
        <header className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Panel de Administración
            </h1>
          </div>
        </header>
      </div>

      <main className="-mt-32">
        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white px-5 py-6 shadow sm:px-6">
            <div className="mb-8">
              <div className="sm:hidden">
                <select
                  className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  value={selectedTab}
                  onChange={(e) => setSelectedTab(Number(e.target.value))}
                >
                  {tabs.map((tab, index) => (
                    <option key={tab.name} value={index}>
                      {tab.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hidden sm:block">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab, index) => (
                      <button
                        key={tab.name}
                        onClick={() => setSelectedTab(index)}
                        className={classNames(
                          selectedTab === index
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                          'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
                        )}
                      >
                        {tab.name}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
            <div className="mt-4">
              {tabs[selectedTab].component}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
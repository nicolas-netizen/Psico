import React from 'react';
import { FileText, Plus } from 'lucide-react';

const ResourcesManager = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Recursos</h2>
        <button
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#91c26a] hover:bg-[#82b35b]"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Recurso
        </button>
      </div>

      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay recursos</h3>
        <p className="mt-1 text-sm text-gray-500">
          Comienza agregando un nuevo recurso.
        </p>
      </div>
    </div>
  );
};

export default ResourcesManager;

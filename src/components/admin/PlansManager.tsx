import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, Check, X } from 'lucide-react';
import type { Plan } from '../../types/Plan';

const PlansManager = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const savedPlans = localStorage.getItem('plans');
    if (savedPlans) {
      setPlans(JSON.parse(savedPlans));
    }
  }, []);

  const savePlans = (newPlans: Plan[]) => {
    localStorage.setItem('plans', JSON.stringify(newPlans));
    setPlans(newPlans);
  };

  const handleAddPlan = () => {
    const newPlan: Plan = {
      id: `plan-${Date.now()}`,
      name: '',
      price: '',
      features: [''],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingPlan(newPlan);
    setIsModalOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan({ ...plan });
    setIsModalOpen(true);
  };

  const handleDeletePlan = (planId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este plan?')) {
      const newPlans = plans.filter(p => p.id !== planId);
      savePlans(newPlans);
    }
  };

  const handleSavePlan = (plan: Plan) => {
    const newPlans = editingPlan?.id
      ? plans.map(p => (p.id === editingPlan.id ? plan : p))
      : [...plans, plan];
    savePlans(newPlans);
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleToggleFeature = (planId: string, feature: 'featured' | 'recommended') => {
    const newPlans = plans.map(plan => {
      if (plan.id === planId) {
        return {
          ...plan,
          [feature]: !plan[feature],
          updatedAt: new Date().toISOString(),
        };
      }
      return plan;
    });
    savePlans(newPlans);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Planes</h2>
        <button
          onClick={handleAddPlan}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#91c26a] hover:bg-[#82b35b]"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Plan
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Características
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {plan.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {plan.price}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <ul className="list-disc list-inside">
                    {plan.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleFeature(plan.id, 'featured')}
                      className={`p-1 rounded ${
                        plan.featured
                          ? 'text-yellow-500 bg-yellow-50'
                          : 'text-gray-400 hover:text-yellow-500'
                      }`}
                      title="Destacado"
                    >
                      <Star className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleToggleFeature(plan.id, 'recommended')}
                      className={`p-1 rounded ${
                        plan.recommended
                          ? 'text-green-500 bg-green-50'
                          : 'text-gray-400 hover:text-green-500'
                      }`}
                      title="Recomendado"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Edición */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingPlan?.id ? 'Editar Plan' : 'Nuevo Plan'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingPlan) {
                  handleSavePlan({
                    ...editingPlan,
                    updatedAt: new Date().toISOString(),
                  });
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editingPlan?.name || ''}
                  onChange={(e) =>
                    setEditingPlan(prev =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Precio
                </label>
                <input
                  type="text"
                  value={editingPlan?.price || ''}
                  onChange={(e) =>
                    setEditingPlan(prev =>
                      prev ? { ...prev, price: e.target.value } : null
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Características
                </label>
                {editingPlan?.features.map((feature, index) => (
                  <div key={index} className="flex mt-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => {
                        const newFeatures = [...(editingPlan?.features || [])];
                        newFeatures[index] = e.target.value;
                        setEditingPlan(prev =>
                          prev ? { ...prev, features: newFeatures } : null
                        );
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newFeatures = editingPlan?.features.filter(
                          (_, i) => i !== index
                        );
                        setEditingPlan(prev =>
                          prev ? { ...prev, features: newFeatures } : null
                        );
                      }}
                      className="ml-2 text-red-600 hover:text-red-900"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setEditingPlan(prev =>
                      prev
                        ? {
                            ...prev,
                            features: [...prev.features, ''],
                          }
                        : null
                    )
                  }
                  className="mt-2 text-sm text-[#91c26a] hover:text-[#82b35b]"
                >
                  + Agregar característica
                </button>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingPlan?.featured || false}
                    onChange={(e) =>
                      setEditingPlan(prev =>
                        prev ? { ...prev, featured: e.target.checked } : null
                      )
                    }
                    className="rounded border-gray-300 text-[#91c26a] focus:ring-[#91c26a]"
                  />
                  <span className="ml-2 text-sm text-gray-700">Destacado</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingPlan?.recommended || false}
                    onChange={(e) =>
                      setEditingPlan(prev =>
                        prev ? { ...prev, recommended: e.target.checked } : null
                      )
                    }
                    className="rounded border-gray-300 text-[#91c26a] focus:ring-[#91c26a]"
                  />
                  <span className="ml-2 text-sm text-gray-700">Recomendado</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#91c26a] hover:bg-[#82b35b]"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansManager;

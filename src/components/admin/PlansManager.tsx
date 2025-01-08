import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, Check, X } from 'lucide-react';
import type { Plan } from '../../types/Plan';
import api from '../../services/api';
import toast from 'react-hot-toast'; // Import toast

const PlansManager = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const fetchedPlans = await api.getPlans();
        
        // Sort plans to ensure consistent order
        const sortedPlans = fetchedPlans.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        
        setPlans(sortedPlans);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching plans:', err);
        toast.error('No se pudieron cargar los planes');
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

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

  const handleDeletePlan = async (planId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este plan?')) {
      try {
        await api.deletePlan(planId);
        const newPlans = plans.filter(p => p.id !== planId);
        setPlans(newPlans);
      } catch (err) {
        console.error('Error deleting plan:', err);
        setError('No se pudo eliminar el plan');
      }
    }
  };

  const handleSavePlan = async (plan: Plan) => {
    try {
      const updatedPlan = {
        ...plan,
        price: parseFloat(plan.price.toString()),
        features: plan.features.filter(f => f.trim() !== ''),
        updatedAt: new Date().toISOString(),
      };

      let savedPlan;
      if (plan.id.startsWith('plan-')) {
        // New plan
        savedPlan = await api.createPlan(updatedPlan);
        
        // Fetch all plans to ensure we have the full list
        const allPlans = await api.getPlans();
        setPlans(allPlans);
      } else {
        // Existing plan
        savedPlan = await api.updatePlan(plan.id.toString(), updatedPlan);
        
        // Fetch all plans to ensure we have the full list
        const allPlans = await api.getPlans();
        setPlans(allPlans);
      }

      setIsModalOpen(false);
      setEditingPlan(null);
      toast.success('Plan guardado exitosamente');
    } catch (err) {
      console.error('Error saving plan:', err);
      toast.error('No se pudo guardar el plan');
      setError('No se pudo guardar el plan');
    }
  };

  const handleToggleFeature = async (planId: string, feature: 'featured' | 'recommended') => {
    try {
      const planToUpdate = plans.find(p => p.id === planId);
      if (!planToUpdate) {
        toast.error('Plan no encontrado');
        return;
      }

      const updatedPlan = {
        ...planToUpdate,
        [feature]: !planToUpdate[feature],
        updatedAt: new Date().toISOString()
      };

      const response = await api.updatePlan(planId, updatedPlan);
      
      const newPlans = plans.map(p => 
        p.id === planId ? response.plan : p
      );
      
      setPlans(newPlans);
      toast.success(`Plan ${feature === 'featured' ? 'destacado' : 'recomendado'} actualizado`);
    } catch (err) {
      console.error('Error toggling feature:', err);
      toast.error(`No se pudo actualizar el plan: ${err.message}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Error Notification */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

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
                    {plan.features?.map((feature, index) => (
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
                {editingPlan?.id.startsWith('plan-') ? 'Nuevo Plan' : 'Editar Plan'}
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
                  handleSavePlan(editingPlan);
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
                    setEditingPlan(prev => prev ? { ...prev, name: e.target.value } : null)
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#91c26a] focus:border-[#91c26a]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Precio
                </label>
                <input
                  type="number"
                  value={editingPlan?.price || ''}
                  onChange={(e) => 
                    setEditingPlan(prev => prev ? { ...prev, price: e.target.value } : null)
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#91c26a] focus:border-[#91c26a]"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Características
                </label>
                {editingPlan?.features?.map((feature, index) => (
                  <div key={index} className="flex items-center mt-1">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => 
                        setEditingPlan(prev => {
                          if (!prev) return null;
                          const newFeatures = [...prev.features];
                          newFeatures[index] = e.target.value;
                          return { ...prev, features: newFeatures };
                        })
                      }
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#91c26a] focus:border-[#91c26a]"
                      placeholder="Característica"
                    />
                    <button
                      type="button"
                      onClick={() => 
                        setEditingPlan(prev => {
                          if (!prev) return null;
                          const newFeatures = prev.features.filter((_, i) => i !== index);
                          return { ...prev, features: newFeatures };
                        })
                      }
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => 
                    setEditingPlan(prev => prev 
                      ? { ...prev, features: [...prev.features, ''] } 
                      : null
                    )
                  }
                  className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-[#91c26a] bg-[#91c26a]/10 hover:bg-[#91c26a]/20 focus:outline-none"
                >
                  <Plus className="h-4 w-4 mr-1" /> Añadir Característica
                </button>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#91c26a] hover:bg-[#82b35b]"
                >
                  Guardar Plan
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

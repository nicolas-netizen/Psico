import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plan, createPlan, getPlans, updatePlan, deletePlan } from '../../services/firestore';

interface PlanFormData {
  name: string;
  description: string;
  price: number;
  features: string[];
  isFeatured: boolean;
  hasCustomTest: boolean;
}

const PlansManager: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    description: '',
    price: 0,
    features: [''],
    isFeatured: false,
    hasCustomTest: false,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const fetchedPlans = await getPlans();
      setPlans(fetchedPlans);
    } catch (error) {
      toast.error('Error al cargar los planes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id!, {
          ...formData,
          updatedAt: new Date(),
        });
        toast.success('Plan actualizado exitosamente');
      } else {
        await createPlan(formData);
        toast.success('Plan creado exitosamente');
      }
      resetForm();
      loadPlans();
    } catch (error) {
      toast.error('Error al guardar el plan');
    }
  };

  const handleDelete = async (planId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este plan?')) {
      try {
        await deletePlan(planId);
        toast.success('Plan eliminado exitosamente');
        loadPlans();
      } catch (error) {
        toast.error('Error al eliminar el plan');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      features: [''],
      isFeatured: false,
      hasCustomTest: false,
    });
    setEditingPlan(null);
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold">
          {editingPlan ? 'Editar Plan' : 'Crear Nuevo Plan'}
        </h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Precio</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.hasCustomTest}
              onChange={(e) => setFormData({ ...formData, hasCustomTest: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Incluye Test Personalizado</span>
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Plan destacado</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Características</label>
          {formData.features.map((feature, index) => (
            <div key={index} className="mt-1 flex space-x-2">
              <input
                type="text"
                value={feature}
                onChange={(e) => {
                  const newFeatures = [...formData.features];
                  newFeatures[index] = e.target.value;
                  setFormData({ ...formData, features: newFeatures });
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
              <button
                type="button"
                onClick={() => {
                  const newFeatures = formData.features.filter((_, i) => i !== index);
                  setFormData({ ...formData, features: newFeatures });
                }}
                className="text-red-600 hover:text-red-800"
              >
                Eliminar
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFormData({ ...formData, features: [...formData.features, ''] })}
            className="mt-2 text-indigo-600 hover:text-indigo-800"
          >
            + Agregar característica
          </button>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
          </button>
        </div>
      </form>

      <div className="mt-8 space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                <p className="mt-1 text-gray-500">{plan.description}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">${plan.price}</p>
                {plan.hasCustomTest && (
                  <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Test Personalizado
                  </span>
                )}
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingPlan(plan);
                    setFormData({
                      name: plan.name,
                      description: plan.description,
                      price: plan.price,
                      features: plan.features,
                      isFeatured: plan.isFeatured || false,
                      hasCustomTest: plan.hasCustomTest || false,
                    });
                  }}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(plan.id!)}
                  className="text-red-600 hover:text-red-900"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlansManager;

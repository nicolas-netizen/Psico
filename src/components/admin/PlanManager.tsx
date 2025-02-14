import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-hot-toast';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  active: boolean;
  duration: number; // en días
  hasCustomTest: boolean; // Nueva propiedad
}

const PlanManager: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const plansSnapshot = await getDocs(collection(db, 'plans'));
      const plansData = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Plan[];
      setPlans(plansData);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Error al cargar los planes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este plan?')) {
      try {
        await deleteDoc(doc(db, 'plans', planId));
        toast.success('Plan eliminado correctamente');
        fetchPlans();
      } catch (error) {
        console.error('Error deleting plan:', error);
        toast.error('Error al eliminar el plan');
      }
    }
  };

  const handleToggleActive = async (planId: string, currentActive: boolean) => {
    try {
      await updateDoc(doc(db, 'plans', planId), {
        active: !currentActive
      });
      toast.success(`Plan ${!currentActive ? 'activado' : 'desactivado'} correctamente`);
      fetchPlans();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Error al actualizar el plan');
    }
  };

  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    
    if (editingPlan) {
      setEditingPlan({
        ...editingPlan,
        features: [...editingPlan.features, newFeature.trim()]
      });
    }
    setNewFeature('');
  };

  const handleRemoveFeature = (index: number) => {
    if (editingPlan) {
      const newFeatures = editingPlan.features.filter((_, i) => i !== index);
      setEditingPlan({
        ...editingPlan,
        features: newFeatures
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      if (isCreating) {
        await addDoc(collection(db, 'plans'), {
          name: editingPlan.name,
          description: editingPlan.description,
          price: editingPlan.price,
          features: editingPlan.features,
          active: true,
          duration: editingPlan.duration,
          hasCustomTest: editingPlan.hasCustomTest
        });
        toast.success('Plan creado correctamente');
      } else {
        await updateDoc(doc(db, 'plans', editingPlan.id), {
          name: editingPlan.name,
          description: editingPlan.description,
          price: editingPlan.price,
          features: editingPlan.features,
          duration: editingPlan.duration,
          hasCustomTest: editingPlan.hasCustomTest
        });
        toast.success('Plan actualizado correctamente');
      }
      setEditingPlan(null);
      setIsCreating(false);
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Error al guardar el plan');
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingPlan({
      id: '',
      name: '',
      description: '',
      price: 0,
      features: [],
      active: true,
      duration: 30,
      hasCustomTest: false
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Gestión de Planes</h2>
        <button
          onClick={handleCreateNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Crear Nuevo Plan
        </button>
      </div>

      {/* Plans List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {plans.map((plan) => (
            <li key={plan.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {plan.description}
                    </p>
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-900">
                        ${plan.price} / {plan.duration} días
                      </span>
                      {plan.hasCustomTest && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Test Personalizado
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-gray-900">Características:</h4>
                      <ul className="mt-1 space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="text-sm text-gray-500">
                            • {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleToggleActive(plan.id, plan.active)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        plan.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {plan.active ? 'Activo' : 'Inactivo'}
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setEditingPlan(plan);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Edit/Create Form */}
      {editingPlan && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {isCreating ? 'Crear Nuevo Plan' : 'Editar Plan'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  id="description"
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Precio
                </label>
                <input
                  type="number"
                  id="price"
                  value={editingPlan.price}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  Duración (días)
                </label>
                <input
                  type="number"
                  id="duration"
                  value={editingPlan.duration}
                  onChange={(e) => setEditingPlan({ ...editingPlan, duration: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingPlan.hasCustomTest}
                    onChange={(e) => setEditingPlan({ ...editingPlan, hasCustomTest: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Incluye Test Personalizado</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Características
                </label>
                <div className="mt-1 space-y-2">
                  {editingPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...editingPlan.features];
                          newFeatures[index] = e.target.value;
                          setEditingPlan({ ...editingPlan, features: newFeatures });
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Nueva característica"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPlan(null);
                    setIsCreating(false);
                  }}
                  className="bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  {isCreating ? 'Crear Plan' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanManager;

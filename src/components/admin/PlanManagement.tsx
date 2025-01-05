import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Star, Check, X } from 'lucide-react';
import type { Plan } from '../../types/Plan';

const PlanManagement = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    features: [''],
    recommended: false,
    featured: false,
    description: '',
  });

  useEffect(() => {
    // Cargar planes del localStorage
    const savedPlans = localStorage.getItem('plans');
    if (savedPlans) {
      setPlans(JSON.parse(savedPlans));
    }
  }, []);

  const savePlans = (newPlans: Plan[]) => {
    localStorage.setItem('plans', JSON.stringify(newPlans));
    setPlans(newPlans);
  };

  const handleAddFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ''],
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => (i === index ? value : feature)),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date().toISOString();

    const planData: Plan = {
      id: currentPlan?.id || crypto.randomUUID(),
      ...formData,
      features: formData.features.filter(f => f.trim() !== ''),
      createdAt: currentPlan?.createdAt || timestamp,
      updatedAt: timestamp,
    };

    if (currentPlan) {
      savePlans(plans.map(p => (p.id === currentPlan.id ? planData : p)));
    } else {
      savePlans([...plans, planData]);
    }

    setIsModalOpen(false);
    setCurrentPlan(null);
    setFormData({
      name: '',
      price: '',
      features: [''],
      recommended: false,
      featured: false,
      description: '',
    });
  };

  const handleEdit = (plan: Plan) => {
    setCurrentPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      features: plan.features,
      recommended: plan.recommended || false,
      featured: plan.featured || false,
      description: plan.description || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (planId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este plan?')) {
      savePlans(plans.filter(p => p.id !== planId));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Planes</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#91c26a] text-white px-4 py-2 rounded-lg hover:bg-[#82b35b] transition-colors"
        >
          <Plus size={20} />
          Nuevo Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-gray-600">{plan.price}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(plan)}
                  className="p-2 text-gray-600 hover:text-[#91c26a] transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-600">
                  <Check size={16} className="text-[#91c26a]" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-4">
              {plan.recommended && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#91c26a] text-white">
                  Recomendado
                </span>
              )}
              {plan.featured && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400 text-white">
                  Destacado
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal para crear/editar plan */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {currentPlan ? 'Editar Plan' : 'Nuevo Plan'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setCurrentPlan(null);
                  setFormData({
                    name: '',
                    price: '',
                    features: [''],
                    recommended: false,
                    featured: false,
                    description: '',
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Plan
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#91c26a]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio
                </label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#91c26a]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Características
                </label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={e => handleFeatureChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#91c26a]"
                      placeholder="Característica del plan"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="mt-2 text-[#91c26a] hover:text-[#82b35b] flex items-center gap-1"
                >
                  <Plus size={16} />
                  Agregar característica
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#91c26a]"
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.recommended}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, recommended: e.target.checked }))
                    }
                    className="rounded text-[#91c26a] focus:ring-[#91c26a]"
                  />
                  <span className="text-sm text-gray-700">Plan recomendado</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, featured: e.target.checked }))
                    }
                    className="rounded text-[#91c26a] focus:ring-[#91c26a]"
                  />
                  <span className="text-sm text-gray-700">Plan destacado</span>
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setCurrentPlan(null);
                    setFormData({
                      name: '',
                      price: '',
                      features: [''],
                      recommended: false,
                      featured: false,
                      description: '',
                    });
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b] transition-colors"
                >
                  {currentPlan ? 'Guardar Cambios' : 'Crear Plan'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PlanManagement;

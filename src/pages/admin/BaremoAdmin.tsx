import React, { useState, useEffect } from 'react';
import { BaremoConfig, BaremoCategory, BaremoRule } from '../../types/baremo';
import { baremoService } from '../../services/baremoService';
import { toast } from 'react-toastify';
import AddBaremoCategory from '../../components/baremo/AddBaremoCategory';
import EditBaremoRule from '../../components/baremo/EditBaremoRule';
import EditBaremoCategory from '../../components/baremo/EditBaremoCategory';

const BaremoAdmin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [baremoConfig, setBaremoConfig] = useState<BaremoConfig | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingRule, setEditingRule] = useState<BaremoRule | null>(null);
  const [editingCategory, setEditingCategory] = useState<BaremoCategory | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);

  useEffect(() => {
    loadBaremoConfig();
  }, []);

  const loadBaremoConfig = async () => {
    try {
      const config = await baremoService.getBaremoConfig();
      setBaremoConfig(config);
    } catch (error) {
      console.error('Error loading baremo config:', error);
      toast.error('Error al cargar la configuración del baremo');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (category: BaremoCategory) => {
    try {
      await baremoService.updateCategory(category);
      await loadBaremoConfig();
      setEditingCategory(null);
      toast.success('Categoría actualizada correctamente');
    } catch (error) {
      toast.error('Error al actualizar la categoría');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta categoría? Se eliminarán también todas sus reglas.')) return;
    try {
      await baremoService.deleteCategory(categoryId);
      await loadBaremoConfig();
      setSelectedCategory('');
      toast.success('Categoría eliminada correctamente');
    } catch (error) {
      toast.error('Error al eliminar la categoría');
    }
  };

  const handleRuleChange = async (rule: BaremoRule) => {
    try {
      await baremoService.updateRule(rule);
      await loadBaremoConfig();
      setEditingRule(null);
      toast.success('Regla actualizada correctamente');
    } catch (error) {
      toast.error('Error al actualizar la regla');
    }
  };

  const handleAddRule = async (categoryId: string) => {
    try {
      const newRule = {
        category: categoryId,
        minScore: 0,
        maxScore: 0,
        points: 0,
        description: ''
      };
      await baremoService.createRule(newRule);
      await loadBaremoConfig();
      toast.success('Regla creada correctamente');
    } catch (error) {
      toast.error('Error al crear la regla');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta regla?')) return;
    try {
      await baremoService.deleteRule(ruleId);
      await loadBaremoConfig();
      toast.success('Regla eliminada correctamente');
    } catch (error) {
      toast.error('Error al eliminar la regla');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Gestión del Baremo
        </h2>
        <button
          onClick={() => setShowAddCategory(!showAddCategory)}
          className="px-4 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#7ea756] transition-colors"
        >
          {showAddCategory ? 'Cancelar' : 'Agregar Categoría'}
        </button>
      </div>

      {showAddCategory && (
        <div className="mb-8">
          <AddBaremoCategory
            onCategoryAdded={() => {
              loadBaremoConfig();
              setShowAddCategory(false);
            }}
          />
        </div>
      )}

      {/* Selector de Categorías */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Categorías</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {baremoConfig?.categories.map((category) => (
            <div
              key={category.id}
              className={`border rounded-lg p-4 hover:border-[#91c26a] transition-colors ${
                selectedCategory === category.id ? 'border-[#91c26a] bg-green-50' : ''
              }`}
            >
              {editingCategory?.id === category.id ? (
                <EditBaremoCategory
                  category={category}
                  onSave={handleCategoryChange}
                  onCancel={() => setEditingCategory(null)}
                />
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-900">{category.name}</h4>
                    <span className="text-sm text-gray-500">
                      Max: {category.maxPoints || 0} pts
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                  <div className="text-sm text-gray-500 mb-2">
                    <p>Puntaje máximo: {category.maxScore || 0}</p>
                    <p>Puntos asignados: {category.maxPoints || 0}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <button
                        onClick={() => setSelectedCategory(category.id)}
                        className="text-[#91c26a] hover:text-[#7ea756] text-sm mr-3"
                      >
                        Ver Reglas
                      </button>
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="text-[#91c26a] hover:text-[#7ea756] text-sm"
                      >
                        Editar
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reglas de la Categoría Seleccionada */}
      {selectedCategory && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Reglas de {baremoConfig?.categories.find(c => c.id === selectedCategory)?.name}
            </h3>
            <button
              onClick={() => handleAddRule(selectedCategory)}
              className="px-4 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#7ea756] transition-colors"
            >
              Agregar Regla
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rango
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puntos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {baremoConfig?.rules
                  .filter(rule => rule.category === selectedCategory)
                  .map((rule) => (
                    <tr key={rule.id}>
                      {editingRule?.id === rule.id ? (
                        <td colSpan={4} className="px-6 py-4">
                          <EditBaremoRule
                            rule={rule}
                            onSave={handleRuleChange}
                            onCancel={() => setEditingRule(null)}
                          />
                        </td>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {rule.minScore} - {rule.maxScore}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {rule.points} pts
                          </td>
                          <td className="px-6 py-4">
                            {rule.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setEditingRule(rule)}
                              className="text-[#91c26a] hover:text-[#7ea756] mr-3"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Eliminar
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaremoAdmin;

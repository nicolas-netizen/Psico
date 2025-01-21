import React, { useState, useEffect } from 'react';
import { baremoService } from '../services/baremoService';
import { BaremoConfig, BaremoCategory } from '../types/baremo';
import { toast } from 'react-toastify';

const BaremoCalculator: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [baremoConfig, setBaremoConfig] = useState<BaremoConfig | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [score, setScore] = useState<string>('');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadBaremoConfig();
  }, []);

  const loadBaremoConfig = async () => {
    try {
      const config = await baremoService.getBaremoConfig();
      setBaremoConfig(config);
      if (config.categories.length > 0) {
        setSelectedCategory(config.categories[0].id);
      }
    } catch (error) {
      console.error('Error loading baremo config:', error);
      toast.error('Error al cargar la configuración del baremo');
    } finally {
      setLoading(false);
    }
  };

  const calculatePoints = () => {
    if (!selectedCategory || !score) {
      setError('Por favor, complete todos los campos');
      return;
    }

    const numScore = parseFloat(score);
    if (isNaN(numScore)) {
      setError('El puntaje debe ser un número válido');
      return;
    }

    const category = baremoConfig?.categories.find(c => c.id === selectedCategory);
    const rules = baremoConfig?.rules.filter(r => r.category === selectedCategory) || [];

    const matchingRule = rules.find(r => numScore >= r.minScore && numScore <= r.maxScore);

    if (matchingRule) {
      setResult(matchingRule.points);
      setError('');
    } else {
      setError('No se encontró una regla para el puntaje ingresado');
      setResult(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {baremoConfig?.categories.map((category: BaremoCategory) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {selectedCategory && (
            <p className="mt-2 text-sm text-gray-500">
              {baremoConfig?.categories.find(c => c.id === selectedCategory)?.description}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Puntaje
          </label>
          <div className="relative">
            <input
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ingrese el puntaje"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={calculatePoints}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Calcular Puntos
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-center">{error}</p>
        </div>
      )}

      {result !== null && !error && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
          <h3 className="text-lg font-medium text-green-900 mb-2">
            Resultado del Cálculo
          </h3>
          <div className="text-3xl font-bold text-green-600">
            {result} puntos
          </div>
          <p className="mt-2 text-sm text-green-700">
            {baremoConfig?.rules.find(r => 
              r.category === selectedCategory && 
              parseFloat(score) >= r.minScore && 
              parseFloat(score) <= r.maxScore
            )?.description}
          </p>
        </div>
      )}

      {/* Tabla de Referencia */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Tabla de Referencia
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rango de Puntaje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {baremoConfig?.rules
                .filter(rule => rule.category === selectedCategory)
                .sort((a, b) => a.minScore - b.minScore)
                .map((rule, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rule.minScore} - {rule.maxScore}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rule.points}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {rule.description}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BaremoCalculator;

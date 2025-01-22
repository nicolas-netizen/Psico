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
      console.log('Config loaded:', config); // Para debug
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
    
    if (!category) {
      setError('Categoría no encontrada');
      return;
    }

    // Asegurarse de que los valores existan y sean números
    if (typeof category.maxScore !== 'number' || typeof category.maxPoints !== 'number') {
      setError('La categoría no tiene configurados los puntajes máximos');
      return;
    }

    if (numScore < 0 || numScore > category.maxScore) {
      setError(`El puntaje debe estar entre 0 y ${category.maxScore}`);
      return;
    }

    // Cálculo proporcional: (puntaje actual * puntos máximos) / puntaje máximo
    const calculatedPoints = (numScore * category.maxPoints) / category.maxScore;
    const roundedPoints = Math.round(calculatedPoints * 100) / 100; // Redondear a 2 decimales
    
    console.log('Cálculo:', {
      numScore,
      maxPoints: category.maxPoints,
      maxScore: category.maxScore,
      result: roundedPoints
    }); // Para debug

    setResult(roundedPoints);
    setError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  const selectedCategoryData = baremoConfig?.categories.find(c => c.id === selectedCategory);

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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-[#91c26a]"
          >
            {baremoConfig?.categories.map((category: BaremoCategory) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {selectedCategoryData && (
            <div className="mt-2 text-sm text-gray-500">
              <p>{selectedCategoryData.description}</p>
              <p className="mt-1">
                Puntaje máximo: {selectedCategoryData.maxScore || 'No definido'} puntos
              </p>
              <p>
                Puntos asignados: {selectedCategoryData.maxPoints || 'No definido'} puntos
              </p>
            </div>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-[#91c26a]"
              placeholder={`Ingrese el puntaje (0-${selectedCategoryData?.maxScore || 0})`}
              min="0"
              max={selectedCategoryData?.maxScore || 0}
              step="any"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={calculatePoints}
          className="px-8 py-3 bg-[#91c26a] text-white rounded-lg hover:bg-[#7da55b] focus:outline-none focus:ring-2 focus:ring-[#91c26a] focus:ring-offset-2 transition-colors"
        >
          Calcular Puntos
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-center">{error}</p>
        </div>
      )}

      {result !== null && !error && selectedCategoryData && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
          <h3 className="text-lg font-medium text-green-900 mb-2">
            Resultado del Cálculo
          </h3>
          <div className="text-3xl font-bold text-green-600">
            {result} puntos
          </div>
          <p className="mt-2 text-sm text-green-700">
            Basado en un puntaje máximo de {selectedCategoryData.maxScore} puntos
            y {selectedCategoryData.maxPoints} puntos asignados para esta categoría
          </p>
        </div>
      )}

      {/* Información de la fórmula */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          ¿Cómo se calcula?
        </h3>
        <p className="text-gray-600">
          Los puntos se calculan de manera proporcional usando la siguiente fórmula:
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Puntos = (Puntaje ingresado × Puntos asignados) ÷ Puntaje máximo
        </p>
      </div>
    </div>
  );
};

export default BaremoCalculator;

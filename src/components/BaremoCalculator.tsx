import React, { useState, useEffect } from 'react';
import { baremoService } from '../services/baremoService';
import { BaremoConfig, BaremoCategory } from '../types/baremo';
import { toast } from 'react-toastify';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, History, HelpCircle } from 'lucide-react';

interface CalculationHistory {
  id: string;
  category: string;
  score: number;
  result: number;
  timestamp: Date;
}

const BaremoCalculator: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [baremoConfig, setBaremoConfig] = useState<BaremoConfig | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [score, setScore] = useState<string>('');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    loadBaremoConfig();
    // Cargar historial del localStorage
    const savedHistory = localStorage.getItem('baremoHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory).map((item: CalculationHistory) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
    }
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

    const category = baremoConfig?.categories.find((c: BaremoCategory) => c.id === selectedCategory);
    
    if (!category) {
      setError('Categoría no encontrada');
      return;
    }

    if (typeof category.maxScore !== 'number' || typeof category.maxPoints !== 'number') {
      setError('La categoría no tiene configurados los puntajes máximos');
      return;
    }

    if (numScore < 0 || numScore > category.maxScore) {
      setError(`El puntaje debe estar entre 0 y ${category.maxScore}`);
      return;
    }

    const calculatedPoints = (numScore * category.maxPoints) / category.maxScore;
    const roundedPoints = Math.round(calculatedPoints * 100) / 100;

    setResult(roundedPoints);
    setError('');

    // Guardar en el historial
    const newCalculation: CalculationHistory = {
      id: Date.now().toString(),
      category: category.name,
      score: numScore,
      result: roundedPoints,
      timestamp: new Date()
    };

    const updatedHistory = [newCalculation, ...history].slice(0, 10); // Mantener solo los últimos 10
    setHistory(updatedHistory);
    localStorage.setItem('baremoHistory', JSON.stringify(updatedHistory));
  };

  const exportToCSV = () => {
    if (history.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const headers = ['Fecha', 'Categoría', 'Puntaje', 'Resultado'];
    const csvContent = [
      headers.join(','),
      ...history.map(item => [
        item.timestamp.toLocaleString(),
        item.category,
        item.score,
        item.result
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `baremo_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  const selectedCategoryData = baremoConfig?.categories.find((c: BaremoCategory) => c.id === selectedCategory);

  const chartData = history
    .filter(item => item.category === selectedCategoryData?.name)
    .map(item => ({
      timestamp: item.timestamp.toLocaleTimeString(),
      puntaje: item.score,
      resultado: item.result
    }))
    .reverse();

  return (
    <div className="space-y-8">
      {/* Botones de acción */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <HelpCircle className="w-5 h-5 mr-2" />
          Info
        </button>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <History className="w-5 h-5 mr-2" />
          Historial
        </button>
        <button
          onClick={exportToCSV}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <Download className="w-5 h-5 mr-2" />
          Exportar
        </button>
      </div>

      {showInfo && (
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Información sobre Baremos
          </h3>
          <div className="space-y-4 text-blue-800">
            <p>
              Los baremos son escalas de valores que permiten transformar puntuaciones directas en puntuaciones normalizadas, facilitando la interpretación de los resultados de una evaluación.
            </p>
            <p>
              Esta calculadora utiliza una transformación proporcional lineal, donde:
              <br />
              - El puntaje máximo de la prueba se corresponde con los puntos máximos asignados
              <br />
              - Los puntajes intermedios se calculan proporcionalmente
            </p>
          </div>
        </div>
      )}

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

      {showHistory && history.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Historial de Cálculos
            </h3>
            {chartData.length > 0 && (
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="puntaje" stroke="#82ca9d" name="Puntaje" />
                    <Line type="monotone" dataKey="resultado" stroke="#8884d8" name="Resultado" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Puntaje
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resultado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.timestamp.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.score}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.result}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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

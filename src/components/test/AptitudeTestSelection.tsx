import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Book, Calculator, Lightbulb } from 'lucide-react';
import { api } from '../../services/api';

interface Test {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
}

const categoryIcons = {
  'verbal': Book,
  'numerical': Calculator,
  'logical': Brain,
  'general': Lightbulb,
};

const AptitudeTestSelection: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await api.getTests();
        setTests(response);
      } catch (err) {
        console.error('Error fetching tests:', err);
        setError('Error al cargar los tests');
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const categories = Array.from(new Set(tests.map(test => test.category)));

  const filteredTests = selectedCategory
    ? tests.filter(test => test.category === selectedCategory)
    : tests;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#91c26a] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-[#91c26a] text-white rounded hover:bg-[#6ea844]"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Tests de Aptitud</h1>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Selecciona una categoría para ver los tests disponibles o explora todos los tests a continuación.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors ${
              !selectedCategory
                ? 'bg-[#91c26a] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todos
          </button>
          {categories.map(category => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons] || Brain;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#91c26a] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{category}</span>
              </button>
            );
          })}
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map(test => {
            const Icon = categoryIcons[test.category as keyof typeof categoryIcons] || Brain;
            return (
              <div
                key={test.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 text-[#91c26a] mb-2">
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{test.category}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {test.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">{test.description}</p>
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600">
                        {test.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/take-test?testId=${test.id}`)}
                  className="w-full px-4 py-2 bg-[#91c26a] text-white rounded hover:bg-[#6ea844] transition-colors"
                >
                  Comenzar Test
                </button>
              </div>
            );
          })}
        </div>

        {filteredTests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No hay tests disponibles en esta categoría.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AptitudeTestSelection;

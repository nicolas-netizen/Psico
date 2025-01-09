import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Aptitude, 
  AptitudeTest, 
  AptitudeCategory, 
  AptitudeDifficulty 
} from '../../types/Test';

// Aptitude Icons mapping
const aptitudeIcons = {
  [Aptitude.SPATIAL_INTELLIGENCE]: '🌐',
  [Aptitude.MATHEMATICAL_LOGIC]: '🔢',
  [Aptitude.LINGUISTIC_INTELLIGENCE]: '📚',
  [Aptitude.MUSICAL_INTELLIGENCE]: '🎵',
  [Aptitude.BODILY_KINESTHETIC]: '🏃',
  [Aptitude.INTERPERSONAL_INTELLIGENCE]: '👥',
  [Aptitude.INTRAPERSONAL_INTELLIGENCE]: '🧘',
  [Aptitude.NATURALISTIC_INTELLIGENCE]: '🌿',
  [Aptitude.EMOTIONAL_INTELLIGENCE]: '❤️'
};

const difficultyColors = {
  [AptitudeDifficulty.EASY]: 'bg-green-100 text-green-800',
  [AptitudeDifficulty.MEDIUM]: 'bg-yellow-100 text-yellow-800',
  [AptitudeDifficulty.HARD]: 'bg-red-100 text-red-800'
};

const AptitudeTestSelection: React.FC = () => {
  const navigate = useNavigate();
  const { fetchAptitudeTests, generateTest } = useAuth();
  const [aptitudeTests, setAptitudeTests] = useState<AptitudeTest[]>([]);
  const [selectedAptitude, setSelectedAptitude] = useState<Aptitude | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AptitudeCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTests = async () => {
      try {
        const tests = await fetchAptitudeTests();
        setAptitudeTests(tests);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching aptitude tests:', error);
        setLoading(false);
      }
    };

    loadTests();
  }, [fetchAptitudeTests]);

  const handleStartRandomTest = async () => {
    try {
      const test = await generateTest({ 
        type: 'random',
        requiredCategories: Object.values(Aptitude)
      });
      navigate('/take-test', { state: { test } });
    } catch (error) {
      console.error('Error generating random test:', error);
    }
  };

  const handleStartAptitudeTest = async (aptitude: Aptitude) => {
    setSelectedAptitude(aptitude);
    setSelectedCategory(null);
  };

  const handleStartCategoryTest = async (category: AptitudeCategory) => {
    try {
      const test = await generateTest({ 
        type: 'category',
        specificCategory: category 
      });
      navigate('/take-test', { state: { test } });
    } catch (error) {
      console.error(`Error generating ${category} test:`, error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-4 text-gray-600">Cargando tests de aptitud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Selecciona tu Test de Aptitud
          </h1>
          <p className="text-gray-600">
            Elige un test específico o realiza un test aleatorio para descubrir tus habilidades
          </p>
        </div>

        {/* Random Test Option */}
        <div className="mb-12 text-center">
          <button 
            onClick={handleStartRandomTest}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full text-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
          >
            🎲 Test Aleatorio Completo
          </button>
        </div>

        {/* Aptitude Selection or Category Selection */}
        {!selectedAptitude ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Object.values(Aptitude).map((aptitude) => (
              <div 
                key={aptitude}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden"
              >
                <div className="p-6 text-center">
                  <div className="text-6xl mb-4">
                    {aptitudeIcons[aptitude]}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    {aptitude}
                  </h3>
                  <button 
                    onClick={() => handleStartAptitudeTest(aptitude)}
                    className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Seleccionar Aptitud
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <button 
              onClick={() => setSelectedAptitude(null)}
              className="mb-6 text-blue-600 hover:text-blue-800 flex items-center"
            >
              ← Volver a Aptitudes
            </button>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {selectedAptitude} - Categorías
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aptitudeTests
                .find(test => test.aptitude === selectedAptitude)
                ?.categories.map((category) => (
                  <div 
                    key={category.id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden"
                  >
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {category.name}
                      </h3>
                      <p className="text-gray-500 text-sm mb-4">
                        {category.description}
                      </p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColors[category.difficulty]}`}>
                        {category.difficulty}
                      </span>
                      <button 
                        onClick={() => handleStartCategoryTest(category.name)}
                        className="w-full mt-4 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Iniciar Test
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AptitudeTestSelection;

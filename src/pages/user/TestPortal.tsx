import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { Test, TestResult } from '../../types/Test';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiCheckCircle, FiBarChart2, FiBookOpen } from 'react-icons/fi';
import { toast } from 'react-toastify';

interface TestPortalProps {
  // Add any props if needed
}

const TestPortal: React.FC<TestPortalProps> = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [recentResults, setRecentResults] = useState<TestResult[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadTestsAndResults();
  }, [currentUser]);

  const loadTestsAndResults = async () => {
    try {
      setLoading(true);
      
      // Fetch active tests with simple query first
      const testsQuery = query(
        collection(db, 'tests'),
        where('status', '==', 'active')
      );
      const testsSnapshot = await getDocs(testsQuery);
      const testsData = testsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()) as Test[];
      
      setTests(testsData);

      // Fetch categories first
      const categoriesQuery = query(collection(db, 'categories'));
      const categoriesSnapshot = await getDocs(categoriesQuery);
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);

      // Then fetch questions for the first category or selected category
      if (categoriesData.length > 0) {
        const selectedCategory = categoriesData[0].id; // Default to first category
        const questionsQuery = query(
          collection(db, 'questions'),
          where('categoryId', '==', selectedCategory),
          limit(10) // Limit to 10 questions per category
        );
        const questionsSnapshot = await getDocs(questionsQuery);
        const questionsData = questionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setQuestions(questionsData);
      }

      // Load recent user results
      if (currentUser) {
        const resultsQuery = query(
          collection(db, 'testResults'),
          where('userId', '==', currentUser.uid),
          orderBy('finishedAt', 'desc'),
          limit(5) // Limit to last 5 results
        );
        const resultsSnapshot = await getDocs(resultsQuery);
        const resultsData = resultsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TestResult[];
        setRecentResults(resultsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      if (error instanceof Error) {
        if (error.message.includes('requires an index')) {
          toast.error('Error de índice en la base de datos. Por favor, contacte al administrador.');
        } else {
          toast.error('Error al cargar los datos: ' + error.message);
        }
      } else {
        toast.error('Error desconocido al cargar los datos');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (testId: string) => {
    navigate(`/test/${testId}`);
  };

  const handleCategoryChange = async (categoryId: string) => {
    try {
      setLoading(true);
      setSelectedCategory(categoryId);
      
      const questionsQuery = query(
        collection(db, 'questions'),
        where('categoryId', '==', categoryId),
        limit(10)
      );
      const questionsSnapshot = await getDocs(questionsQuery);
      const questionsData = questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Error al cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tests Disponibles */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <FiBookOpen className="mr-2" /> Tests Disponibles
          </h2>
          {tests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600">No hay tests disponibles para tu plan actual</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map(test => (
                <div key={test.id} className="bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{test.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{test.description}</p>
                    
                    <div className="space-y-3 mb-6">
                      {test.blockConfigs.map((config, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <FiClock className="mr-2" />
                          <span>{config.block}: {config.questionCount} preguntas, {config.timeLimit} min</span>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => handleStartTest(test.id!)}
                      className="w-full bg-[#91c26a] text-white py-2 px-4 rounded-md hover:bg-[#7ea756] transition duration-300 flex items-center justify-center"
                    >
                      <FiCheckCircle className="mr-2" /> Realizar Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Categories Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Categorías</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`p-4 rounded-lg shadow ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>

        {/* Questions Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Preguntas</h2>
          {loading ? (
            <div className="text-center">
              <p>Cargando preguntas...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600">
                {selectedCategory
                  ? 'No hay preguntas disponibles para esta categoría'
                  : 'Seleccione una categoría para ver las preguntas'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {questions.map(question => (
                <div key={question.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{question.text}</h3>
                    <div className="space-y-4">
                      {question.options?.map((option: string, index: number) => (
                        <div key={index} className="flex items-center">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            id={`${question.id}-${index}`}
                            className="mr-3"
                          />
                          <label htmlFor={`${question.id}-${index}`}>{option}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Resultados Recientes */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <FiBarChart2 className="mr-2" /> Resultados Recientes
          </h2>
          {recentResults.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600">No hay resultados disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentResults.map(result => {
                const test = tests.find(t => t.id === result.testId);
                return (
                  <div key={result.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {test?.title || 'Test Completado'}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Puntuación Total:</span>
                          <span className="font-semibold text-[#91c26a]">{result.totalScore.toFixed(2)}%</span>
                        </div>
                        {result.blockScores.map((blockScore, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{blockScore.block}:</span>
                            <span className="font-medium">
                              {blockScore.correct}/{blockScore.total} ({((blockScore.correct/blockScore.total)*100).toFixed(1)}%)
                            </span>
                          </div>
                        ))}
                        <div className="text-xs text-gray-500 mt-2">
                          Completado el: {new Date(result.finishedAt.toDate()).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-3">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-[#91c26a] h-2.5 rounded-full"
                          style={{ width: `${result.totalScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TestPortal;

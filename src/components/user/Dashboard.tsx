import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { Test, TestResult, QuestionBlock } from '../../types/Test';
import { FiClock, FiCheckCircle, FiBarChart2, FiBookOpen, FiSettings, FiAward, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-toastify';

const DIFFICULTY_LEVELS = ['Fácil', 'Intermedio', 'Difícil'];

const Dashboard = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [recentResults, setRecentResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [userStats, setUserStats] = useState({
    testsCompleted: 0,
    averageScore: 0,
    bestBlock: '',
    recentProgress: []
  });
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadTestsAndResults();
  }, [currentUser, selectedBlock, selectedDifficulty]);

  const loadTestsAndResults = async () => {
    try {
      setLoading(true);
      
      // Cargar tests activos
      const testsQuery = query(
        collection(db, 'tests'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      const testsSnapshot = await getDocs(testsQuery);
      const testsData = testsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Test[];
      setTests(testsData);

      // Cargar resultados recientes del usuario
      if (currentUser) {
        const resultsQuery = query(
          collection(db, 'testResults'),
          where('userId', '==', currentUser.uid),
          orderBy('finishedAt', 'desc'),
          limit(10)
        );
        const resultsSnapshot = await getDocs(resultsQuery);
        const resultsData = resultsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TestResult[];
        setRecentResults(resultsData);

        // Calcular estadísticas del usuario
        calculateUserStats(resultsData);
      }
    } catch (error) {
      console.error('Error loading tests and results:', error);
      toast.error('Error al cargar los tests y resultados');
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = (results: TestResult[]) => {
    if (results.length === 0) {
      setUserStats({
        testsCompleted: 0,
        averageScore: 0,
        bestBlock: '',
        recentProgress: []
      });
      return;
    }

    const totalTests = results.length;
    const totalScore = results.reduce((sum, result) => sum + result.totalScore, 0);
    const averageScore = totalScore / totalTests;

    // Encontrar el mejor bloque
    const blockScores: { [key: string]: { correct: number; total: number } } = {};
    results.forEach(result => {
      result.blockScores.forEach(score => {
        if (!blockScores[score.block]) {
          blockScores[score.block] = { correct: 0, total: 0 };
        }
        blockScores[score.block].correct += score.correct;
        blockScores[score.block].total += score.total;
      });
    });

    let bestBlock = '';
    let bestScore = 0;
    Object.entries(blockScores).forEach(([block, scores]) => {
      const percentage = (scores.correct / scores.total) * 100;
      if (percentage > bestScore) {
        bestScore = percentage;
        bestBlock = block;
      }
    });

    // Calcular progreso reciente
    const recentProgress = results.slice(0, 5).map(result => ({
      date: result.finishedAt,
      score: result.totalScore
    }));

    setUserStats({
      testsCompleted: totalTests,
      averageScore: Math.round(averageScore),
      bestBlock,
      recentProgress
    });
  };

  const handleStartTest = (testId: string) => {
    navigate(`/test/${testId}`);
  };

  const filteredTests = tests.filter(test => {
    if (selectedBlock !== 'all') {
      const hasBlock = test.blockConfigs.some(config => config.block === selectedBlock);
      if (!hasBlock) return false;
    }
    if (selectedDifficulty !== 'all' && test.difficulty !== selectedDifficulty) {
      return false;
    }
    return true;
  });

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
        {/* Estadísticas del Usuario */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FiCheckCircle className="text-[#91c26a] text-xl mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Tests Completados</h3>
            </div>
            <p className="mt-2 text-3xl font-semibold text-gray-700">{userStats.testsCompleted}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FiBarChart2 className="text-[#91c26a] text-xl mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Promedio</h3>
            </div>
            <p className="mt-2 text-3xl font-semibold text-gray-700">{userStats.averageScore}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FiAward className="text-[#91c26a] text-xl mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Mejor Bloque</h3>
            </div>
            <p className="mt-2 text-xl font-semibold text-gray-700">{userStats.bestBlock || 'N/A'}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FiTrendingUp className="text-[#91c26a] text-xl mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Tendencia</h3>
            </div>
            <div className="mt-2 h-16 flex items-end space-x-1">
              {userStats.recentProgress.map((progress, index) => (
                <div
                  key={index}
                  className="bg-[#91c26a] rounded-t"
                  style={{
                    height: `${progress.score}%`,
                    width: '20%'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiSettings className="mr-2" /> Personalizar Tests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bloque
              </label>
              <select
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#91c26a] focus:border-[#91c26a] sm:text-sm rounded-md"
              >
                <option value="all">Todos los bloques</option>
                {Object.values(QuestionBlock).map((block) => (
                  <option key={block} value={block}>
                    {block}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dificultad
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#91c26a] focus:border-[#91c26a] sm:text-sm rounded-md"
              >
                <option value="all">Todas las dificultades</option>
                {DIFFICULTY_LEVELS.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tests Disponibles */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FiBookOpen className="mr-2" /> Tests Disponibles
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredTests.length > 0 ? (
              filteredTests.map((test) => (
                <div key={test.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{test.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{test.description}</p>
                      <div className="mt-2 flex items-center space-x-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {test.difficulty}
                        </span>
                        <span className="flex items-center text-sm text-gray-500">
                          <FiClock className="mr-1" />
                          {test.blockConfigs.reduce((total, config) => total + config.timeLimit, 0)} min
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartTest(test.id!)}
                      className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#91c26a] hover:bg-[#7ea756] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#91c26a]"
                    >
                      Comenzar Test
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                No hay tests disponibles con los filtros seleccionados
              </div>
            )}
          </div>
        </div>

        {/* Resultados Recientes */}
        {recentResults.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiBarChart2 className="mr-2" /> Resultados Recientes
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentResults.map((result) => (
                <div key={result.id} className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Test #{result.testId.slice(-4)}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {new Date(result.finishedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-gray-900">{result.totalScore}%</p>
                      <p className="mt-1 text-sm text-gray-500">Puntuación Total</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {result.blockScores.map((score, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700">{score.block}</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {Math.round((score.correct / score.total) * 100)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

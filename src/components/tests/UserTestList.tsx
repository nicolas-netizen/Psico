import React, { useState, useEffect } from 'react';
import { Test } from '../../types/Test';
import api from '../../services/api';
import TestTaker from './TestTaker';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Star, 
  AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast'; // Assuming you have react-hot-toast installed

interface UserTestListProps {
  userId: string;
  userPlan: string;
}

const UserTestList: React.FC<UserTestListProps> = ({ userId, userPlan }) => {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestsAndHistory = async () => {
      try {
        setLoading(true);
        console.log('UserTestList: Fetching tests for User Plan:', userPlan);
        console.log('UserTestList: User ID:', userId);
        
        // Fetch tests for the user's plan
        const planTests = await api.getTestsByPlan(userPlan);
        
        console.group('UserTestList Test Fetching');
        console.log('Received Plan Tests:', JSON.stringify(planTests, null, 2));
        console.log('Number of Plan Tests:', planTests.length);
        
        // Log details of each test
        planTests.forEach((test, index) => {
          console.log(`Test ${index + 1}:`, {
            id: test.id,
            title: test.title,
            plans: test.plans,
            difficulty: test.difficulty,
            description: test.description
          });
        });
        console.groupEnd();

        setTests(planTests);

        // Fetch user's test history
        const history = await api.getUserTestHistory(userId);
        console.log('User Test History:', history);
        setTestHistory(history);
      } catch (err) {
        console.error('UserTestList: Error in fetchTestsAndHistory:', err);
        setError('No se pudieron cargar los tests');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if both userId and userPlan are available
    if (userId && userPlan) {
      fetchTestsAndHistory();
    } else {
      console.warn('UserTestList: Missing userId or userPlan', { userId, userPlan });
    }
  }, [userId, userPlan]);

  useEffect(() => {
    console.group('UserTestList Debug Info');
    console.log('User:', user);
    console.log('User ID:', userId);
    console.log('User Plan:', userPlan);
    console.log('Tests:', tests);
    console.log('Test History:', testHistory);
    console.groupEnd();
  }, [user, userId, userPlan, tests, testHistory]);

  const handleTestSelect = (test: Test) => {
    try {
      console.error('Test Selection Debug:', {
        test: JSON.stringify(test, null, 2),
        user: JSON.stringify(user, null, 2),
        userId: userId,
        userPlan: userPlan,
        testId: test.id,
        testPlans: test.plans,
        isCompleted: isTestCompleted(test.id)
      });

      // Comprehensive validation
      if (!user) {
        toast.error('Debes iniciar sesión para realizar el test');
        return;
      }

      if (!test) {
        toast.error('Test no válido');
        return;
      }

      if (isTestCompleted(test.id)) {
        toast.info('Ya has completado este test');
        return;
      }

      // Additional plan access check
      const canAccessTest = test.plans?.some(
        planId => planId === userPlan || 
        (user.subscription?.planName?.toLowerCase() === 'god')
      );

      if (!canAccessTest) {
        toast.error('No tienes acceso a este test con tu plan actual');
        return;
      }

      // Force log test details before selection
      console.error('Test Details Before Selection:', {
        testQuestions: test.questions,
        questionCount: test.questions?.length
      });

      // If all checks pass, select the test
      setSelectedTest(test);
    } catch (error) {
      console.error('Error in handleTestSelect:', error);
      toast.error('Hubo un problema al seleccionar el test');
    }
  };

  const isTestCompleted = (testId: string) => {
    return testHistory.some(history => history.testId === testId);
  };

  const getTestScore = (testId: string) => {
    const testResult = testHistory.find(history => history.testId === testId);
    return testResult ? testResult.score : null;
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'basic':
        return <Star className="text-green-500" size={20} />;
      case 'intermediate':
        return <Star className="text-yellow-500" size={20} />;
      case 'advanced':
        return <Star className="text-red-500" size={20} />;
      default:
        return <AlertTriangle className="text-gray-500" size={20} />;
    }
  };

  if (loading) {
    return <div>Cargando tests...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Tests Disponibles para tu Plan
      </h2>

      {tests.length === 0 ? (
        <div className="text-center py-10 bg-gray-100 rounded-lg">
          <BookOpen className="mx-auto mb-4 text-gray-500" size={48} />
          <p className="text-gray-600">
            No hay tests disponibles para tu plan actual.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Contacta con soporte para más información.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => {
            const completed = isTestCompleted(test.id);
            const score = getTestScore(test.id);

            return (
              <div 
                key={test.id} 
                className={`
                  border rounded-lg p-6 shadow-md transition-all duration-300
                  ${completed 
                    ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                    : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300'}
                  cursor-pointer
                `}
                onClick={() => !completed && handleTestSelect(test)}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {test.title || 'Test Sin Título'}
                  </h3>
                  {getDifficultyIcon(test.difficulty || 'basic')}
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {test.description || 'Sin descripción'}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="text-gray-500" size={16} />
                    <span className="text-sm text-gray-600">
                      {test.timeLimit || 30} min
                    </span>
                  </div>

                  {completed ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle size={20} />
                      <span className="font-medium">
                        Completado: {score?.toFixed(0)}%
                      </span>
                    </div>
                  ) : (
                    <button 
                      className="
                        bg-blue-500 text-white px-3 py-1 rounded-md 
                        hover:bg-blue-600 transition-colors
                      "
                    >
                      Iniciar Test
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTest && (
        <TestTaker 
          test={selectedTest} 
          onClose={() => {
            console.error('Closing TestTaker, resetting selected test');
            setSelectedTest(null);
          }} 
        />
      )}
    </div>
  );
};

export default UserTestList;

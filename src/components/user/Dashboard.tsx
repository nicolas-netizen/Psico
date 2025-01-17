import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserStats, getUserPlan } from '../../services/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Test } from '../../types/Test';
import { toast } from 'react-hot-toast';

interface UserStats {
  totalTests: number;
  completedTests: number;
  averageScore: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats>({
    totalTests: 0,
    completedTests: 0,
    averageScore: 0,
  });
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Cargar estadísticas del usuario
        const userStats = await getUserStats(user.uid);
        setStats(userStats);

        // Obtener el plan del usuario
        const userPlan = await getUserPlan(user.uid);
        
        if (!userPlan) {
          toast.error('No tienes un plan activo. Por favor, contacta al administrador.');
          setLoading(false);
          return;
        }

        // Obtener tests disponibles para el plan del usuario
        const testsQuery = query(
          collection(db, 'tests'),
          where('plans', 'array-contains', userPlan.id),
          where('status', '==', 'active')
        );
        
        const testsSnapshot = await getDocs(testsQuery);
        
        if (testsSnapshot.empty) {
          toast.info('No hay tests disponibles para tu plan en este momento');
          setAvailableTests([]);
        } else {
          const tests = testsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Test[];
          setAvailableTests(tests);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Error al cargar los datos. Por favor, intenta de nuevo más tarde.');
        setAvailableTests([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleStartTest = (testId: string) => {
    navigate(`/take-test/${testId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Estadísticas del usuario */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Tests Completados</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.completedTests}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Tests Disponibles</h3>
          <p className="text-3xl font-bold text-green-600">{availableTests.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Puntuación Promedio</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.averageScore}%</p>
        </div>
      </div>

      {/* Lista de tests disponibles */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Tests Disponibles</h2>
        {availableTests.length === 0 ? (
          <p className="text-gray-600">No hay tests disponibles en este momento.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableTests.map((test) => (
              <div key={test.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-lg mb-2">{test.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{test.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {test.questions?.length || 0} preguntas
                  </span>
                  <button
                    onClick={() => handleStartTest(test.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Comenzar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { Users, BookOpen, Clock, Target, Award, TrendingUp, AlertCircle } from 'lucide-react';

interface RecentTest {
  id: string;
  userName: string;
  testName: string;
  score: number;
  date: Date;
}

interface UserActivity {
  email: string;
  lastActive: Date;
  planName: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTests: 0,
    completedTests: 0,
    averageScore: 0,
    premiumUsers: 0,
    totalQuestions: 0,
    todayActiveUsers: 0
  });
  const [recentTests, setRecentTests] = useState<RecentTest[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        
        // Referencias a las colecciones
        const usersRef = collection(db, 'users');
        const testsRef = collection(db, 'testResults');
        const questionsRef = collection(db, 'questions');

        // Obtener datos básicos
        const [usersSnapshot, testsSnapshot, questionsSnapshot] = await Promise.all([
          getDocs(usersRef),
          getDocs(testsRef),
          getDocs(questionsRef)
        ]);

        // Calcular usuarios activos hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(today);
        
        const activeUsersQuery = query(
          usersRef,
          where('lastActive', '>=', todayTimestamp)
        );
        
        // Calcular usuarios premium
        const premiumUsersQuery = query(
          usersRef,
          where('planId', '!=', null)
        );

        const [activeUsersSnapshot, premiumUsersSnapshot] = await Promise.all([
          getDocs(activeUsersQuery),
          getDocs(premiumUsersQuery)
        ]);

        // Calcular estadísticas
        const testScores = testsSnapshot.docs.map(doc => doc.data().score || 0);
        const averageScore = testScores.length > 0 
          ? Math.round(testScores.reduce((a, b) => a + b, 0) / testScores.length)
          : 0;

        setStats({
          totalUsers: usersSnapshot.size,
          activeTests: 0,
          completedTests: testsSnapshot.size,
          averageScore,
          premiumUsers: premiumUsersSnapshot.size,
          totalQuestions: questionsSnapshot.size,
          todayActiveUsers: activeUsersSnapshot.size
        });

        // Obtener tests recientes
        const recentTestsQuery = query(
          testsRef,
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const recentTestsSnapshot = await getDocs(recentTestsQuery);
        
        const testsData = await Promise.all(
          recentTestsSnapshot.docs.map(async (testDoc) => {
            const testData = testDoc.data();
            if (!testData.userId) return null;
            
            try {
              const userDoc = await getDoc(doc(usersRef, testData.userId));
              const userData = userDoc.data();
              
              return {
                id: testDoc.id,
                userName: userData?.email || 'Usuario Anónimo',
                testName: testData.testName || 'Test sin nombre',
                score: testData.score || 0,
                date: testData.createdAt?.toDate() || new Date()
              };
            } catch (error) {
              console.error('Error fetching user data for test:', error);
              return null;
            }
          })
        );

        setRecentTests(testsData.filter((test): test is RecentTest => test !== null));

        // Obtener usuarios activos
        const activeUsersListQuery = query(
          usersRef,
          orderBy('lastActive', 'desc'),
          limit(5)
        );
        
        const activeUsersListSnapshot = await getDocs(activeUsersListQuery);
        
        const usersData = await Promise.all(
          activeUsersListSnapshot.docs.map(async (userDoc) => {
            const userData = userDoc.data();
            let planName = 'Plan Gratuito';
            
            if (userData.planId) {
              try {
                const planDoc = await getDoc(doc(db, 'plans', userData.planId));
                if (planDoc.exists()) {
                  planName = planDoc.data().name;
                }
              } catch (error) {
                console.error('Error fetching plan data:', error);
              }
            }
            
            return {
              email: userData.email || 'Usuario sin email',
              lastActive: userData.lastActive?.toDate() || new Date(),
              planName
            };
          })
        );
        
        setActiveUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Error al cargar los datos del dashboard');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ icon: Icon, title, value, description, color }: any) => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {description && (
              <p className="ml-2 text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-medium text-gray-900">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Panel de Control</h2>
        <button
          onClick={() => navigate('/admin/tests/new')}
          className="px-4 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b] transition-colors"
        >
          Crear Nuevo Test
        </button>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Usuarios Totales"
          value={stats.totalUsers}
          color="bg-blue-500"
        />
        <StatCard
          icon={Target}
          title="Tests Activos"
          value={stats.activeTests}
          color="bg-green-500"
        />
        <StatCard
          icon={Clock}
          title="Tests Completados"
          value={stats.completedTests}
          color="bg-purple-500"
        />
        <StatCard
          icon={Award}
          title="Puntuación Promedio"
          value={`${stats.averageScore}%`}
          color="bg-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tests Recientes */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tests Recientes</h3>
          <div className="space-y-4">
            {recentTests.map((test) => (
              <div key={test.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{test.userName}</p>
                  <p className="text-sm text-gray-500">{test.testName}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-[#91c26a]">{test.score}%</p>
                  <p className="text-sm text-gray-500">
                    {test.date.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Usuarios Activos */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Usuarios Activos</h3>
          <div className="space-y-4">
            {activeUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <p className="text-sm text-gray-500">{user.planName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Último acceso: {user.lastActive.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/admin/questions')}
          className="p-6 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-left"
        >
          <BookOpen className="h-8 w-8 text-[#91c26a] mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Gestionar Preguntas</h3>
          <p className="text-sm text-gray-500 mt-2">
            Crear y editar preguntas para los tests
          </p>
        </button>

        <button
          onClick={() => navigate('/admin/plans')}
          className="p-6 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-left"
        >
          <TrendingUp className="h-8 w-8 text-[#91c26a] mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Gestionar Planes</h3>
          <p className="text-sm text-gray-500 mt-2">
            Administrar planes y suscripciones
          </p>
        </button>

        <button
          onClick={() => navigate('/admin/reports')}
          className="p-6 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-left"
        >
          <AlertCircle className="h-8 w-8 text-[#91c26a] mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Reportes</h3>
          <p className="text-sm text-gray-500 mt-2">
            Ver estadísticas y análisis detallados
          </p>
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;

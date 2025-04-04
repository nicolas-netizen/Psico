import { useState, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { collection, getDocs, query, where, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Users, BookOpen, Clock, Target, Award, TrendingUp, AlertCircle } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';



interface Report {
  id: string;
  userId: string;
  type: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTests: 0,
    completedTests: 0,
    averageScore: 0,
    premiumUsers: 0,
    totalQuestions: 0,
    todayActiveUsers: 0,
    questions: 0,
    activeSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Referencias a las colecciones
        const usersRef = collection(db, 'users');
        const testsRef = collection(db, 'test_results');
        const questionsRef = collection(db, 'questions');
        const subscriptionsRef = collection(db, 'subscriptions');
        const reportsRef = collection(db, 'reports');

        // Obtener datos básicos
        const [usersSnapshot, testsSnapshot, questionsSnapshot, subscriptionsSnapshot, reportsSnapshot] = await Promise.all([
          getDocs(usersRef),
          getDocs(testsRef),
          getDocs(questionsRef),
          getDocs(subscriptionsRef),
          getDocs(reportsRef)
        ]);

        console.log('Snapshots obtenidos:', {
          users: usersSnapshot.size,
          tests: testsSnapshot.size,
          questions: questionsSnapshot.size,
          subscriptions: subscriptionsSnapshot.size,
          reports: reportsSnapshot.size
        });

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
          where('plan', '!=', 'free')
        );

        const [activeUsersSnapshot, premiumUsersSnapshot] = await Promise.all([
          getDocs(activeUsersQuery),
          getDocs(premiumUsersQuery)
        ]);

        // Calcular estadísticas de tests
        const testsData = testsSnapshot.docs.map(doc => doc.data());
        const completedTests = testsData.filter(test => test.status === 'completed').length;
        const activeTests = testsData.filter(test => test.status === 'in_progress').length;
        const testScores = testsData
          .filter(test => test.status === 'completed')
          .map(test => test.score || 0);
        
        const averageScore = testScores.length > 0 
          ? Math.round(testScores.reduce((a, b) => a + b, 0) / testScores.length)
          : 0;

        // Obtener reportes
        const reportsData = reportsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          type: doc.data().type || 'bug',
          status: doc.data().status || 'pending',
          description: doc.data().description || 'Sin descripción'
        })) as Report[];

        console.log('Datos procesados:', {
          completedTests,
          activeTests,
          averageScore,
          reportsCount: reportsData.length
        });

        setReports(reportsData);
        
        setStats({
          totalUsers: usersSnapshot.size,
          activeTests,
          completedTests,
          averageScore,
          premiumUsers: premiumUsersSnapshot.size,
          totalQuestions: questionsSnapshot.size,
          todayActiveUsers: activeUsersSnapshot.size,
          questions: questionsSnapshot.size,
          activeSubscriptions: subscriptionsSnapshot.docs.filter(doc => doc.data().status === 'active').length
        });

        setLoading(false);
      } catch (err) {
        console.error('Error al cargar los datos del dashboard:', err);
        setError('Error al cargar los datos del dashboard');
        setLoading(false);
      }
    };

    if (!currentUser) {
      navigate('/login');
      return;
    }

    fetchDashboardData();
  }, [currentUser]);

  const handleUpdateReportStatus = async (reportId: string, newStatus: Report['status']) => {
    try {
      // Actualizar el estado local
      setReports(prevReports =>
        prevReports.map(report =>
          report.id === reportId
            ? { ...report, status: newStatus, updatedAt: new Date() }
            : report
        )
      );

      // Actualizar el estado en la base de datos
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      toast.success('Estado del reporte actualizado');
    } catch (error) {
      console.error('Error updating report status:', error);
      toast.error('Error al actualizar el estado del reporte');
    }
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'in_progress':
        return 'En Proceso';
      case 'resolved':
        return 'Resuelto';
      default:
        return status;
    }
  };

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Panel de Control</h1>
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
        <StatCard
          icon={BookOpen}
          title="Preguntas Totales"
          value={stats.questions}
          color="bg-orange-500"
        />
        <StatCard
          icon={TrendingUp}
          title="Suscripciones Activas"
          value={stats.activeSubscriptions}
          color="bg-red-500"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de línea - Actividad de usuarios */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Actividad de Usuarios</h3>
          <Line
            data={{
              labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
              datasets: [
                {
                  label: 'Usuarios Activos',
                  data: [stats.todayActiveUsers, stats.todayActiveUsers-2, stats.todayActiveUsers+1, 
                         stats.todayActiveUsers-1, stats.todayActiveUsers+2, stats.todayActiveUsers-3, 
                         stats.todayActiveUsers],
                  fill: false,
                  borderColor: '#91c26a',
                  tension: 0.1
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: true,
                  text: 'Actividad Semanal'
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        </div>

        {/* Gráfico de barras - Distribución de tests */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución de Tests</h3>
          <Bar
            data={{
              labels: ['Completados', 'Activos', 'Pendientes'],
              datasets: [
                {
                  label: 'Cantidad',
                  data: [stats.completedTests, stats.activeTests, 
                         Math.round(stats.completedTests * 0.2)], // Estimación de pendientes
                  backgroundColor: [
                    '#91c26a',
                    '#4a90e2',
                    '#e6e6e6'
                  ]
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: true,
                  text: 'Estado de Tests'
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        </div>
      </div>

      {/* Reportes */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-green-100 text-green-800">
                      {report.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xl overflow-hidden text-ellipsis">
                      {report.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {getStatusText(report.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={report.status}
                      onChange={(e) => handleUpdateReportStatus(report.id, e.target.value as Report['status'])}
                      className="text-sm rounded-lg border-gray-300 focus:ring-[#91c26a] focus:border-[#91c26a]"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="in_progress">En Proceso</option>
                      <option value="resolved">Resuelto</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <button
          onClick={() => navigate('/admin/questions')}
          className="p-6 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-left"
        >
          <BookOpen className="h-8 w-8 text-[#91c26a] mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Gestionar Preguntas</h3>
          <p className="text-sm text-gray-500 mt-2">
            Crear y editar preguntas para los tests
          </p>
          <div className="mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {stats.questions} preguntas disponibles
          </div>
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
          <div className="mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {stats.activeSubscriptions} suscripciones activas
          </div>
        </button>

        <div className="p-6 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-left">
          <AlertCircle className="h-8 w-8 text-[#91c26a] mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Reportes</h3>
          <p className="text-sm text-gray-500 mt-2">
            Ver estadísticas y análisis detallados
          </p>
          <div className="mt-3">
            <Link
              to="/admin/reports"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#91c26a] hover:bg-[#82b35b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#91c26a]"
            >
              Ver Reportes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

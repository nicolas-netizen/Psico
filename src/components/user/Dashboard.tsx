import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-hot-toast';

interface Test {
  id: string;
  title: string;
  description: string;
}

interface UserPlan {
  planId: string;
  planName: string;
  tests: string[];
  active: boolean;
  endDate: any;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Obtener el plan del usuario
        if (user) {
          const userPlanRef = doc(db, 'userPlans', user.uid);
          const userPlanDoc = await getDoc(userPlanRef);
          
          if (userPlanDoc.exists()) {
            setUserPlan(userPlanDoc.data() as UserPlan);
          }
        }

        // Obtener los tests disponibles
        const testsRef = collection(db, 'tests');
        const snapshot = await getDocs(testsRef);
        const testsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Test[];

        // Filtrar tests según el plan del usuario
        if (userPlan) {
          const availableTests = testsData.filter(test => 
            userPlan.tests.includes(test.id)
          );
          setTests(availableTests);
        } else {
          // Si no tiene plan, mostrar solo tests gratuitos
          const freeTests = testsData.filter(test => 
            test.id === 'test1' || test.id === 'test2' // IDs de tests gratuitos
          );
          setTests(freeTests);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 pb-32">
        <div className="max-w-7xl mx-auto pt-12 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
            Bienvenido a tu Dashboard
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-indigo-100">
            Accede a tus tests psicológicos y descubre más sobre ti mismo
          </p>
        </div>
      </div>

      {/* Plan Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-[-4rem] mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {userPlan ? `Plan ${userPlan.planName}` : 'Plan Gratuito'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {userPlan ? 
                    `Válido hasta ${new Date(userPlan.endDate.seconds * 1000).toLocaleDateString()}` :
                    'Acceso limitado a tests básicos'}
                </p>
              </div>
              {!userPlan && (
                <Link
                  to="/precios"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Actualizar Plan
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tests Disponibles</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tests.map((test) => (
              <div
                key={test.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-medium text-gray-900">{test.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{test.description}</p>
                <button
                  onClick={() => toast.success('Próximamente podrás realizar este test')}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                >
                  Comenzar Test
                </button>
              </div>
            ))}
          </div>
          
          {tests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay tests disponibles en este momento.</p>
            </div>
          )}
        </div>

        {!userPlan && (
          <div className="mt-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Quieres acceder a más tests?
            </h2>
            <p className="text-gray-600 mb-6">
              Actualiza tu plan para acceder a todos nuestros tests premium y características exclusivas
            </p>
            <Link
              to="/precios"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              Ver Planes Premium
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

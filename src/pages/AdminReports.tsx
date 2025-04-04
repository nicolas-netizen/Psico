import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { UserCircle } from 'lucide-react';

interface Report {
  id: string;
  userId: string;
  type: string;
  description: string;
  email?: string;
  userName?: string;
}

const AdminReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();


  useEffect(() => {
    const fetchReports = async () => {
      try {
        const reportsRef = collection(db, 'reports');
        const q = query(reportsRef, orderBy('type'));
        const querySnapshot = await getDocs(q);
        
        const reportsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Report[];
        
        setReports(reportsData);
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast.error('Error al cargar los reportes');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleDeleteReport = async (reportId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
      try {
        await deleteDoc(doc(db, 'reports', reportId));
        setReports(reports.filter(report => report.id !== reportId));
        toast.success('Reporte eliminado con éxito');
      } catch (error) {
        console.error('Error deleting report:', error);
        toast.error('Error al eliminar el reporte');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Administración de Reportes</h1>
              <p className="mt-2 text-sm text-gray-600">Gestiona los reportes enviados por los usuarios</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <UserCircle className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {currentUser?.email}
                </span>
              </div>
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                Total: {reports.length} reportes
              </span>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="rounded-full bg-gray-100 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg">No hay reportes disponibles</p>
              <p className="text-gray-500 text-sm mt-2">Los reportes aparecerán aquí cuando los usuarios los envíen</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Descripción</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Usuario</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                          <span className="sr-only">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reports.map((report) => (
                        <tr key={report.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                              {report.type}
                            </span>
                          </td>
                          <td className="whitespace-normal px-3 py-4 text-sm text-gray-600 max-w-xl">
                            {report.description}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                            <div className="flex flex-col">
                              <span className="font-medium">{report.email || 'Usuario anónimo'}</span>
                              {report.userName && (
                                <span className="text-gray-500 text-xs mt-0.5">{report.userName}</span>
                              )}
                            </div>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              Eliminar<span className="sr-only">, {report.id}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminReports;

import React, { useState, useEffect } from 'react';
import { User, UserPlus, Edit2, Trash2 } from 'lucide-react';
import type { User as UserType } from '../../types/User';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-toastify';

const UsersManager = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as UserType[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar usuarios');
    }
  };

  const toggleCustomTestAccess = async (userId: string, currentValue: boolean) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', userId), {
        hasCustomTestAccess: !currentValue
      });
      
      // Actualizar la lista local
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, hasCustomTestAccess: !currentValue }
          : user
      ));
      
      toast.success('Permisos actualizados con éxito');
    } catch (error) {
      console.error('Error updating user permissions:', error);
      toast.error('Error al actualizar permisos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
        <button
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#91c26a] hover:bg-[#82b35b]"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Test Personalizado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <User className="h-10 w-10 rounded-full text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || 'Usuario'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.plan || 'Básico'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleCustomTestAccess(user.id, user.hasCustomTestAccess || false)}
                      disabled={loading}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#91c26a] focus:ring-offset-2 ${
                        user.hasCustomTestAccess ? 'bg-[#91c26a]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          user.hasCustomTestAccess ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="ml-2 text-sm text-gray-500">
                      {user.hasCustomTestAccess ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza agregando un nuevo usuario.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManager;

import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, getDocs, doc, deleteDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-toastify';

interface DiscountCode {
  id: string;
  code: string;
  discount: number;
  validUntil: Date;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
}

const DiscountCodeManager = () => {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [newCode, setNewCode] = useState({
    code: '',
    discount: 0,
    validUntil: '',
    maxUses: 0,
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDiscountCodes();
  }, []);

  const loadDiscountCodes = async () => {
    try {
      const codesCollection = collection(db, 'discountCodes');
      const codesSnapshot = await getDocs(codesCollection);
      const codesData = codesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        validUntil: doc.data().validUntil.toDate()
      })) as DiscountCode[];
      setCodes(codesData);
    } catch (error) {
      console.error('Error loading discount codes:', error);
      toast.error('Error al cargar los códigos de descuento');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verificar si el código ya existe
      const codeQuery = query(
        collection(db, 'discountCodes'),
        where('code', '==', newCode.code)
      );
      const existingCodes = await getDocs(codeQuery);

      if (!existingCodes.empty) {
        toast.error('Este código ya existe');
        return;
      }

      // Crear nuevo código de descuento
      await addDoc(collection(db, 'discountCodes'), {
        ...newCode,
        validUntil: new Date(newCode.validUntil),
        currentUses: 0,
        createdAt: new Date()
      });

      toast.success('Código de descuento creado exitosamente');
      setNewCode({
        code: '',
        discount: 0,
        validUntil: '',
        maxUses: 0,
        isActive: true
      });
      loadDiscountCodes();
    } catch (error) {
      console.error('Error creating discount code:', error);
      toast.error('Error al crear el código de descuento');
    } finally {
      setLoading(false);
    }
  };

  const toggleCodeStatus = async (code: DiscountCode) => {
    try {
      await updateDoc(doc(db, 'discountCodes', code.id), {
        isActive: !code.isActive
      });
      toast.success('Estado del código actualizado');
      loadDiscountCodes();
    } catch (error) {
      console.error('Error toggling code status:', error);
      toast.error('Error al actualizar el estado del código');
    }
  };

  const deleteCode = async (codeId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este código?')) {
      try {
        await deleteDoc(doc(db, 'discountCodes', codeId));
        toast.success('Código eliminado exitosamente');
        loadDiscountCodes();
      } catch (error) {
        console.error('Error deleting code:', error);
        toast.error('Error al eliminar el código');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Crear Nuevo Código de Descuento</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Código
              </label>
              <input
                type="text"
                id="code"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newCode.code}
                onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label htmlFor="discount" className="block text-sm font-medium text-gray-700">
                Descuento (%)
              </label>
              <input
                type="number"
                id="discount"
                required
                min="0"
                max="100"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newCode.discount}
                onChange={(e) => setNewCode({ ...newCode, discount: Number(e.target.value) })}
              />
            </div>
            <div>
              <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">
                Válido Hasta
              </label>
              <input
                type="datetime-local"
                id="validUntil"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newCode.validUntil}
                onChange={(e) => setNewCode({ ...newCode, validUntil: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="maxUses" className="block text-sm font-medium text-gray-700">
                Usos Máximos
              </label>
              <input
                type="number"
                id="maxUses"
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newCode.maxUses}
                onChange={(e) => setNewCode({ ...newCode, maxUses: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Código'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Códigos de Descuento Existentes</h2>
        <div className="mt-4 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Código</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Descuento</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Válido Hasta</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Usos</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {codes.map((code) => (
                      <tr key={code.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{code.code}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{code.discount}%</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {code.validUntil.toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {code.currentUses} / {code.maxUses}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              code.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {code.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          <button
                            onClick={() => toggleCodeStatus(code)}
                            className="text-indigo-600 hover:text-indigo-900 mr-2"
                          >
                            {code.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => deleteCode(code.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountCodeManager;

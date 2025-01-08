import React, { useState, useEffect } from 'react';
import { FileText, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

interface Test {
  id?: number;
  title: string;
  description: string;
  fileUrl: string;
  plans: number[];
}

interface Plan {
  id: number;
  name: string;
}

const TestsManager: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [newTest, setNewTest] = useState<Test>({
    title: '',
    description: '',
    fileUrl: '',
    plans: []
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch existing tests and plans
    const fetchData = async () => {
      try {
        // Using a default userId for fetching tests
        const testsResponse = await api.getTests(1);
        const plansResponse = await api.getPlans();
        
        // Only update if we got non-empty responses
        if (testsResponse.length > 0) setTests(testsResponse);
        if (plansResponse.length > 0) setPlans(plansResponse);
        
        // Clear any previous errors
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('No se pudieron cargar los tests o planes. Verifique la conexión del servidor.');
      }
    };
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Temporary file path
      setNewTest(prev => ({
        ...prev,
        fileUrl: `/tests/${e.target.files[0].name}`
      }));
    }
  };

  const handlePlanChange = (planId: number) => {
    setNewTest(prev => {
      const currentPlans = prev.plans;
      const updatedPlans = currentPlans.includes(planId)
        ? currentPlans.filter(id => id !== planId)
        : [...currentPlans, planId];
      
      return {
        ...prev,
        plans: updatedPlans
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!newTest.title || !newTest.description || !newTest.fileUrl || newTest.plans.length === 0) {
      setError('Por favor complete todos los campos');
      return;
    }

    try {
      // Upload file if selected
      let uploadedFileUrl = newTest.fileUrl;
      if (selectedFile) {
        const uploadResponse = await api.uploadFile(selectedFile);
        uploadedFileUrl = uploadResponse.path;
      }

      // Create the test with the uploaded file path
      const testToCreate = {
        ...newTest,
        fileUrl: uploadedFileUrl
      };

      const response = await api.createTest(testToCreate);
      
      // Update local state
      setTests([...tests, response.test]);
      
      // Reset form
      setNewTest({
        title: '',
        description: '',
        fileUrl: '',
        plans: []
      });
      setSelectedFile(null);
    } catch (error) {
      console.error('Error creating test:', error);
      setError('No se pudo crear el test. Verifique la conexión del servidor.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Error Notification */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="mr-2 text-red-600" />
          <p>{error}</p>
        </div>
      )}

      {/* Create New Test Form */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
          <FileText className="mr-2 text-[#91c26a]" />
          Crear Nuevo Test
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Título del Test</label>
            <input
              type="text"
              value={newTest.title}
              onChange={(e) => setNewTest(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#91c26a]"
              placeholder="Ingrese el título del test"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Descripción</label>
            <textarea
              value={newTest.description}
              onChange={(e) => setNewTest(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#91c26a]"
              placeholder="Describa el test"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Archivo del Test</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#91c26a]"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Planes Disponibles</label>
            <div className="flex space-x-4">
              {plans.length === 0 ? (
                <p className="text-gray-500">No hay planes disponibles</p>
              ) : (
                plans.map((plan) => (
                  <div key={plan.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`plan-${plan.id}`}
                      checked={newTest.plans.includes(plan.id)}
                      onChange={() => handlePlanChange(plan.id)}
                      className="h-4 w-4 text-[#91c26a] focus:ring-[#91c26a] border-gray-300 rounded"
                    />
                    <label 
                      htmlFor={`plan-${plan.id}`} 
                      className="ml-2 block text-sm text-gray-900"
                    >
                      {plan.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={plans.length === 0}
              className={`w-full py-2 rounded-md transition-colors ${
                plans.length === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-[#91c26a] text-white hover:bg-[#7ca85c]'
              }`}
            >
              Crear Test
            </button>
          </div>
        </form>
      </div>

      {/* Existing Tests List */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Tests Existentes</h2>
        {tests.length === 0 ? (
          <p className="text-gray-500">No hay tests creados aún</p>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => (
              <div 
                key={test.id} 
                className="border border-gray-200 rounded-md p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{test.title}</h3>
                  <p className="text-gray-600">{test.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    Disponible en planes: {test.plans.map(planId => 
                      plans.find(p => p.id === planId)?.name
                    ).join(', ')}
                  </div>
                </div>
                <a 
                  href={`http://localhost:3000${test.fileUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#91c26a] hover:underline"
                >
                  Ver Archivo
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestsManager;

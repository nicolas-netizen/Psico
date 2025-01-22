import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import { useAuth } from '../../context/AuthContext';
import { testResultService, TestResult } from '../../services/testResultService';

interface ProgressBarProps {
  percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => (
  <div className="h-5 w-full bg-gray-200 rounded-full overflow-hidden">
    <div
      className="h-full bg-[#91c26a] transition-all duration-300 flex items-center justify-center text-white text-sm font-medium"
      style={{ width: `${percentage}%` }}
    >
      {percentage.toFixed(1)}%
    </div>
  </div>
);

const TestResults: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadResults();
  }, [currentUser, navigate]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }
      const userResults = await testResultService.getUserResults(currentUser.uid);
      setResults(userResults);
    } catch (error) {
      console.error('Error al cargar resultados:', error);
      setError('No se pudieron cargar los resultados');
      toast.error('Error al cargar los resultados');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResult = async (resultId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este resultado?')) {
      return;
    }

    try {
      await testResultService.deleteResult(resultId);
      toast.success('Resultado eliminado correctamente');
      loadResults(); // Recargar la lista
    } catch (error) {
      console.error('Error al eliminar resultado:', error);
      toast.error('No se pudo eliminar el resultado');
    }
  };

  const handleRetakeTest = (testId: string) => {
    navigate(`/test/${testId}`);
  };

  const downloadPdf = () => {
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text('Resultados de Tests', 20, 20);
      
      // Información del usuario
      doc.setFontSize(12);
      doc.text(`Usuario: ${currentUser?.email}`, 20, 35);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 45);
      
      // Resultados
      doc.setFontSize(14);
      doc.text('Historial de Tests:', 20, 60);
      
      let yPosition = 70;
      results.forEach(result => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(12);
        doc.text(`Test: ${result.testName || result.testId}`, 20, yPosition);
        doc.text(`Fecha: ${result.completedAt.toLocaleDateString()}`, 20, yPosition + 7);
        doc.text(`Puntuación: ${result.score}/${result.totalQuestions} (${((result.score/result.totalQuestions)*100).toFixed(1)}%)`, 20, yPosition + 14);
        
        yPosition += 25;
      });
      
      doc.save('resultados-tests.pdf');
      toast.success('PDF descargado correctamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadResults}
          className="text-[#91c26a] hover:text-[#7ea756] font-medium"
        >
          Intentar nuevamente
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Historial de Tests</h2>
        {results.length > 0 && (
          <button
            onClick={downloadPdf}
            className="bg-[#91c26a] text-white px-4 py-2 rounded-lg hover:bg-[#7ea756] transition-colors"
          >
            Descargar PDF
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No hay resultados disponibles</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map(result => (
            <div
              key={result.id}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {result.testName || 'Test sin nombre'}
                  </h3>
                  <p className="text-gray-600">
                    {new Date(result.completedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRetakeTest(result.testId)}
                    className="text-[#91c26a] hover:text-[#7ea756] font-medium"
                  >
                    Repetir Test
                  </button>
                  <button
                    onClick={() => handleDeleteResult(result.id)}
                    className="text-red-500 hover:text-red-700 font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Puntuación: {result.score}/{result.totalQuestions}
                </p>
                <ProgressBar percentage={(result.score / result.totalQuestions) * 100} />
              </div>

              {result.testDescription && (
                <p className="text-gray-600 text-sm mt-2">{result.testDescription}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestResults;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Loader2, CheckCircle, XCircle, AlertCircle, TrendingUp, Clock, Target } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: string;
  options?: string[];
  correctAnswer?: number;
  blockName: string;
}

interface TestResult {
  score: number;
  completedAt: Date;
  answers: number[];
  timeSpent: number;
  testType: string;
  blocksUsed: string;
}

interface BlockPerformance {
  blockName: string;
  correct: number;
  total: number;
  percentage: number;
}

const TestReview = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<any>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [blockPerformance, setBlockPerformance] = useState<BlockPerformance[]>([]);

  useEffect(() => {
    loadTestAndResult();
  }, [testId]);

  const loadTestAndResult = async () => {
    if (!testId || !currentUser) return;

    try {
      // Cargar el test
      const testDoc = await getDoc(doc(db, 'temporaryTests', testId));
      if (!testDoc.exists()) {
        toast.error('Test no encontrado');
        navigate('/dashboard');
        return;
      }

      const testData = testDoc.data();
      setTest(testData);

      // Cargar el resultado
      const resultsQuery = query(
        collection(db, 'testResults'),
        where('testId', '==', testId),
        where('userId', '==', currentUser.uid)
      );
      const resultsDocs = await getDocs(resultsQuery);
      
      if (!resultsDocs.empty) {
        const resultData = resultsDocs.docs[0].data() as TestResult;
        setResult(resultData);

        // Calcular rendimiento por bloque
        const performance: BlockPerformance[] = [];
        const questions = testData.questions as Question[];
        
        questions.forEach((question, index) => {
          const blockName = question.blockName;
          const isCorrect = resultData.answers[index] === question.correctAnswer;
          
          const block = performance.find(p => p.blockName === blockName);
          if (block) {
            block.total++;
            if (isCorrect) block.correct++;
          } else {
            performance.push({
              blockName,
              total: 1,
              correct: isCorrect ? 1 : 0,
              percentage: 0
            });
          }
        });

        // Calcular porcentajes
        performance.forEach(block => {
          block.percentage = (block.correct / block.total) * 100;
        });

        // Ordenar por rendimiento
        performance.sort((a, b) => b.percentage - a.percentage);
        setBlockPerformance(performance);
      }
    } catch (error) {
      console.error('Error loading test and result:', error);
      toast.error('Error al cargar los resultados');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-[#91c26a]" />
        <p className="mt-4 text-gray-600">Cargando resultados...</p>
      </div>
    );
  }

  if (!test || !result) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontraron resultados</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Resumen General */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Revisión del Test</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Target className="w-6 h-6 text-[#91c26a]" />
                <h3 className="text-lg font-semibold text-gray-900">Puntuación Total</h3>
              </div>
              <p className="text-3xl font-bold text-[#91c26a]">{result.score.toFixed(1)}%</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Clock className="w-6 h-6 text-[#91c26a]" />
                <h3 className="text-lg font-semibold text-gray-900">Tiempo Utilizado</h3>
              </div>
              <p className="text-3xl font-bold text-[#91c26a]">
                {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <TrendingUp className="w-6 h-6 text-[#91c26a]" />
                <h3 className="text-lg font-semibold text-gray-900">Preguntas Correctas</h3>
              </div>
              <p className="text-3xl font-bold text-[#91c26a]">
                {blockPerformance.reduce((acc, block) => acc + block.correct, 0)} / {test.questions.length}
              </p>
            </div>
          </div>

          {/* Rendimiento por Bloque */}
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Rendimiento por Bloque</h2>
          <div className="space-y-4">
            {blockPerformance.map((block) => (
              <div key={block.blockName} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{block.blockName}</h3>
                  <span className="text-sm text-gray-500">
                    {block.correct} / {block.total} correctas
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-[#91c26a] h-2.5 rounded-full transition-all"
                    style={{ width: `${block.percentage}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-sm">
                  {block.percentage >= 80 ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Excelente dominio
                    </div>
                  ) : block.percentage >= 60 ? (
                    <div className="flex items-center text-yellow-600">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Buen progreso, pero hay espacio para mejorar
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XCircle className="w-4 h-4 mr-2" />
                      Necesita más práctica
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recomendaciones de Mejora</h2>
          <div className="space-y-4">
            {blockPerformance
              .filter(block => block.percentage < 80)
              .map(block => (
                <div key={block.blockName} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{block.blockName}</h3>
                  <p className="text-gray-600">
                    {block.percentage < 60
                      ? `Necesitas reforzar significativamente este bloque. Considera dedicar más tiempo a estudiar los conceptos básicos de ${block.blockName}.`
                      : `Tienes una buena base en ${block.blockName}, pero puedes mejorar practicando más con ejercicios específicos.`}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-4 mt-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 text-gray-600 rounded-lg hover:bg-gray-100"
          >
            Volver al Dashboard
          </button>
          <button
            onClick={() => navigate('/custom-test-creator')}
            className="px-6 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b]"
          >
            Crear Nuevo Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestReview;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Loader2, CheckCircle, XCircle, AlertCircle, TrendingUp, Clock, Target, Lightbulb, CheckCircle2 } from 'lucide-react';

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
      
      // Verificar que el usuario actual es el dueño del test
      if (testData.userId !== currentUser.uid) {
        toast.error('No tienes permiso para ver este test');
        navigate('/dashboard');
        return;
      }

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

        // Eliminar el test temporal ya que ya no lo necesitamos
        try {
          await deleteDoc(doc(db, 'temporaryTests', testId));
        } catch (deleteError) {
          console.error('Error deleting temporary test:', deleteError);
          // No mostramos error al usuario ya que no afecta su experiencia
        }
      }
    } catch (error) {
      console.error('Error loading test and result:', error);
      toast.error('Error al cargar los resultados');
    } finally {
      setLoading(false);
    }
  };

  const getBlockRecommendation = (blockName: string, percentage: number, timeSpent: number) => {
    const recommendations: { [key: string]: { tips: string[], exercises: string[], resources: string[] } } = {
      'Sinónimos': {
        tips: [
          'Practica la lectura activa subrayando sinónimos',
          'Crea tarjetas de estudio con palabras y sus sinónimos',
          'Utiliza un diccionario de sinónimos regularmente'
        ],
        exercises: [
          'Ejercicios de completar oraciones con sinónimos',
          'Juegos de emparejamiento de palabras',
          'Redacción usando sinónimos específicos'
        ],
        resources: [
          'Diccionario de la RAE',
          'Wordreference - Sección de sinónimos',
          'Ejercicios de vocabulario en línea'
        ]
      },
      'Antónimos': {
        tips: [
          'Estudia palabras junto con sus opuestos',
          'Practica identificando antónimos en textos',
          'Crea listas de pares de antónimos'
        ],
        exercises: [
          'Ejercicios de opuestos en contexto',
          'Juegos de palabras contrarias',
          'Práctica con prefijos de negación'
        ],
        resources: [
          'Diccionario de antónimos',
          'Ejercicios de antónimos en línea',
          'Aplicaciones de vocabulario'
        ]
      },
      'Analogías Verbales': {
        tips: [
          'Identifica los tipos de relaciones analógicas',
          'Practica con diferentes categorías de analogías',
          'Analiza la lógica detrás de cada analogía'
        ],
        exercises: [
          'Ejercicios de completar analogías',
          'Crear tus propias analogías',
          'Práctica con analogías complejas'
        ],
        resources: [
          'Guías de razonamiento verbal',
          'Tests de práctica de analogías',
          'Videos explicativos sobre tipos de analogías'
        ]
      },
      'Operaciones Elementales': {
        tips: [
          'Repasa las reglas básicas de aritmética',
          'Practica el cálculo mental',
          'Identifica patrones en operaciones'
        ],
        exercises: [
          'Ejercicios de cálculo rápido',
          'Problemas de matemática básica',
          'Juegos de números'
        ],
        resources: [
          'Khan Academy - Matemáticas básicas',
          'Aplicaciones de práctica matemática',
          'Videos tutoriales de operaciones'
        ]
      }
    };

    const defaultRecommendation = {
      tips: [
        'Practica regularmente con ejercicios específicos',
        'Toma notas y revisa los conceptos básicos',
        'Busca ayuda cuando encuentres dificultades'
      ],
      exercises: [
        'Ejercicios de práctica general',
        'Tests de autoevaluación',
        'Ejercicios de repaso'
      ],
      resources: [
        'Material de estudio en línea',
        'Videos educativos',
        'Libros de práctica'
      ]
    };

    const blockRec = recommendations[blockName] || defaultRecommendation;
    
    return {
      performance: percentage >= 80 ? 'excelente' : percentage >= 60 ? 'bueno' : 'necesita_mejora',
      timeEfficiency: timeSpent > 120 ? 'lento' : timeSpent < 60 ? 'rápido' : 'moderado',
      ...blockRec
    };
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

        {/* Plan de Mejora Personalizado */}
        <div className="bg-white rounded-xl shadow-sm p-8 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Lightbulb className="w-6 h-6 mr-2 text-[#91c26a]" />
            Plan de Mejora Personalizado
          </h2>
          
          <div className="space-y-6">
            {blockPerformance.map(block => {
              const recommendation = getBlockRecommendation(
                block.blockName,
                block.percentage,
                result.timeSpent / test.questions.length
              );

              return (
                <div key={block.blockName} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{block.blockName}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      block.percentage >= 80 ? 'bg-green-100 text-green-800' :
                      block.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {block.percentage >= 80 ? 'Excelente' :
                       block.percentage >= 60 ? 'Buen progreso' :
                       'Necesita práctica'}
                    </span>
                  </div>

                  {block.percentage < 100 && (
                    <>
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Consejos de mejora:</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {recommendation.tips.map((tip, index) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Ejercicios recomendados:</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {recommendation.exercises.map((exercise, index) => (
                            <li key={index}>{exercise}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Recursos útiles:</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {recommendation.resources.map((resource, index) => (
                            <li key={index}>{resource}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {block.percentage === 100 && (
                    <div className="text-green-600">
                      <CheckCircle2 className="w-5 h-5 inline-block mr-2" />
                      ¡Excelente trabajo! Has dominado este bloque perfectamente.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Resumen y Siguiente Paso */}
          <div className="mt-8 p-6 bg-[#91c26a] bg-opacity-10 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Próximos pasos recomendados</h3>
            <p className="text-gray-700 mb-4">
              {blockPerformance.every(b => b.percentage >= 80)
                ? '¡Excelente trabajo! Considera intentar tests más desafiantes para seguir mejorando.'
                : 'Enfócate primero en mejorar los bloques con menor rendimiento. Programa sesiones de práctica regulares.'}
            </p>
            <button
              onClick={() => navigate('/custom-test-creator')}
              className="bg-[#91c26a] text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Crear Nuevo Test de Práctica
            </button>
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

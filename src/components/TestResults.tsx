import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Brain, Trophy, Clock, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Answer {
  blockIndex: number;
  questionIndex: number;
  selectedAnswer: number;
  correct: boolean;
}

const TestResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { testId } = useParams();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [testTitle, setTestTitle] = useState('');
  const answers = location.state?.answers || [];

  useEffect(() => {
    const saveResults = async () => {
      try {
        if (!currentUser || !answers.length) {
          navigate('/dashboard');
          return;
        }

        // Calcular puntuación
        const correctAnswers = answers.filter((answer: Answer) => answer.correct).length;
        const score = Math.round((correctAnswers / answers.length) * 100);

        // Obtener información del test
        if (testId) {
          const testDoc = await getDoc(doc(db, 'tests', testId));
          if (testDoc.exists()) {
            setTestTitle(testDoc.data().title);
          }
        }

        // Guardar resultados
        await addDoc(collection(db, 'results'), {
          userId: currentUser.uid,
          testId,
          answers,
          score,
          completedAt: new Date(),
        });

        setLoading(false);
      } catch (error) {
        console.error('Error saving results:', error);
        toast.error('Error al guardar los resultados');
        navigate('/dashboard');
      }
    };

    saveResults();
  }, [testId, currentUser, answers, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  const correctAnswers = answers.filter((answer: Answer) => answer.correct).length;
  const score = Math.round((correctAnswers / answers.length) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-8"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Volver al Dashboard
      </button>

      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{testTitle || 'Resultados del Test'}</h1>
            <p className="mt-1 text-gray-500">
              Has completado el test. Aquí están tus resultados.
            </p>
          </div>
          <Brain className="w-12 h-12 text-[#91c26a]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900">{score}%</div>
            <div className="text-sm text-gray-500">Puntuación Total</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-gray-900">{correctAnswers}</div>
            <div className="text-sm text-gray-500">Respuestas Correctas</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-gray-900">{answers.length}</div>
            <div className="text-sm text-gray-500">Total de Preguntas</div>
          </div>
        </div>

        <div className="text-center">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
            score >= 70
              ? 'bg-green-100 text-green-800'
              : score >= 50
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {score >= 70
              ? '¡Excelente trabajo!'
              : score >= 50
              ? 'Buen intento'
              : 'Sigue practicando'}
          </div>
        </div>

        <div className="mt-8 border-t pt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Detalles de las Respuestas</h2>
          <div className="space-y-4">
            {answers.map((answer: Answer, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  answer.correct ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      Pregunta {index + 1}
                    </div>
                    <div className="text-sm text-gray-500">
                      Imagen seleccionada: {answer.selectedAnswer + 1}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      answer.correct ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {answer.correct ? 'Correcto' : 'Incorrecto'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('/test')}
            className="px-6 py-3 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b] transition-colors"
          >
            Intentar Otro Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestResults;

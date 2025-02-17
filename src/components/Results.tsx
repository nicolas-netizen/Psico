import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

interface TestSession {
  id: string;
  testId: string;
  userId: string;
  startedAt: Date;
  completedAt: Date;
  answers: {
    blockIndex: number;
    questionIndex: number;
    answer: any;
    isCorrect: boolean;
  }[];
  score: number;
}

const Results = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        if (!currentUser) {
          toast.error('Debes iniciar sesión para ver los resultados');
          navigate('/login');
          return;
        }

        if (!sessionId) {
          toast.error('Sesión no encontrada');
          navigate('/dashboard');
          return;
        }

        const sessionDoc = await getDoc(doc(db, 'testSessions', sessionId));
        if (!sessionDoc.exists()) {
          toast.error('Sesión no encontrada');
          navigate('/dashboard');
          return;
        }

        const sessionData = sessionDoc.data();
        if (sessionData.userId !== currentUser.uid) {
          toast.error('No tienes permiso para ver estos resultados');
          navigate('/dashboard');
          return;
        }

        setSession({ id: sessionDoc.id, ...sessionData } as TestSession);
      } catch (error) {
        console.error('Error loading results:', error);
        toast.error('Error al cargar los resultados');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [sessionId, navigate, currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Resultados del Test</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Resumen</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Puntuación Total</p>
              <p className="text-2xl font-bold text-[#91c26a]">{session.score}%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Preguntas Correctas</p>
              <p className="text-2xl font-bold text-[#91c26a]">
                {session.answers.filter(a => a.isCorrect).length} / {session.answers.length}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Detalle por Pregunta</h2>
          <div className="space-y-4">
            {session.answers.map((answer, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  answer.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium">
                    Pregunta {index + 1} - Bloque {answer.blockIndex + 1}
                  </p>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      answer.isCorrect
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {answer.isCorrect ? 'Correcta' : 'Incorrecta'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-[#91c26a] text-white rounded-lg hover:bg-[#82b35b] transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;

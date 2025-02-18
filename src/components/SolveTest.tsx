import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: string;
  options?: string[];
  correctAnswer?: number;
}

interface Test {
  id: string;
  title: string;
  questions: Question[];
  isTemporary?: boolean;
  userId: string;
  timeLimit?: number;
}

const SolveTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [test, setTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime] = useState(new Date());

  useEffect(() => {
    loadTest();
  }, [testId]);

  useEffect(() => {
    if (test?.timeLimit) {
      setTimeLeft(test.timeLimit);
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [test]);

  const loadTest = async () => {
    if (!testId || !currentUser) return;

    try {
      const testRef = doc(db, 'temporaryTests', testId);
      const testDoc = await getDoc(testRef);
      
      if (testDoc.exists() && testDoc.data().userId === currentUser.uid) {
        setTest({
          id: testDoc.id,
          ...testDoc.data()
        } as Test);
      } else {
        toast.error('Test no encontrado o no tienes permiso para acceder');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error loading test:', error);
      toast.error('Error al cargar el test');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelection = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (test && currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    if (!test) return 0;
    
    let correctAnswers = 0;
    test.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    return (correctAnswers / test.questions.length) * 100;
  };

  const handleSubmit = async () => {
    if (!test || !currentUser) return;

    setSubmitting(true);
    try {
      const score = calculateScore();
      const endTime = new Date();
      const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      // Guardar el resultado
      const resultRef = await addDoc(collection(db, 'testResults'), {
        userId: currentUser.uid,
        testId: test.id,
        score,
        completedAt: new Date(),
        testType: 'custom',
        blocksUsed: location.state?.selectedBlocks || '',
        questionsAnswered: test.questions.length,
        timeSpent,
        answers: selectedAnswers
      });

      // Eliminar el test temporal
      if (test.isTemporary) {
        await deleteDoc(doc(db, 'temporaryTests', test.id));
      }

      toast.success('Test completado exitosamente');
      navigate(`/test-review/${test.id}`);
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Error al enviar el test');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Test no encontrado</p>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        {timeLeft !== null && (
          <div className="mb-4 text-right">
            <div className="text-2xl font-bold text-gray-900">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-gray-500">Tiempo restante</div>
          </div>
        )}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Pregunta {currentQuestionIndex + 1} de {test.questions.length}
            </h2>
            <span className="text-sm text-gray-500">
              {Math.round((currentQuestionIndex + 1) / test.questions.length * 100)}% Completado
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#91c26a] h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / test.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-lg text-gray-800 mb-6">{currentQuestion.text}</p>
          
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelection(index)}
                className={`w-full p-4 text-left rounded-lg transition-all duration-200 ${
                  selectedAnswers[currentQuestionIndex] === index
                    ? 'bg-[#91c26a] text-white'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 text-gray-600 rounded-lg hover:bg-gray-100 
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          {currentQuestionIndex === test.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || selectedAnswers.length !== test.questions.length}
              className="px-6 py-2 bg-[#91c26a] text-white rounded-lg 
                       hover:bg-[#82b35b] transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Enviando...</span>
                </>
              ) : (
                <span>Finalizar Test</span>
              )}
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              disabled={selectedAnswers[currentQuestionIndex] === undefined}
              className="px-6 py-2 text-[#91c26a] border border-[#91c26a] rounded-lg
                       hover:bg-[#91c26a] hover:text-white transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolveTest;

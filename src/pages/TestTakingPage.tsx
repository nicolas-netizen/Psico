import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { testService, Test, Question } from '../services/testService';

const TestTakingPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Inicializar respuestas cuando el test se carga
  useEffect(() => {
    if (test?.questions) {
      const initialAnswers = test.questions.reduce((acc, question) => {
        acc[question.id] = ''; // Inicializa cada respuesta como una cadena vacía
        return acc;
      }, {} as Record<string, string>);
      setAnswers(initialAnswers);
    }
  }, [test]);

  useEffect(() => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para realizar un test');
      navigate('/login');
      return;
    }
    if (!testId) {
      toast.error('ID del test no válido');
      navigate('/dashboard');
      return;
    }
    loadTest();
  }, [currentUser, navigate, testId]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleSubmitTest();
    }
    if (!timeLeft || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev ? prev - 1 : null);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const loadTest = async () => {
    try {
      if (!testId) {
        throw new Error('ID del test no proporcionado');
      }

      console.log('Cargando test con ID:', testId);
      const fetchedTest = await testService.getTestById(testId);
      
      // Validación más estricta del test y su estructura
      if (!fetchedTest || typeof fetchedTest !== 'object') {
        throw new Error('El test recibido no es válido');
      }

      if (!fetchedTest.id || fetchedTest.id !== testId) {
        console.error('ID del test no coincide:', { expected: testId, received: fetchedTest.id });
        throw new Error('El ID del test recibido no es válido');
      }

      if (!fetchedTest.questions || !Array.isArray(fetchedTest.questions) || fetchedTest.questions.length === 0) {
        throw new Error('El test no contiene preguntas válidas');
      }

      // Validar cada pregunta de manera más detallada
      fetchedTest.questions.forEach((q: Question, index: number) => {
        if (!q.id || typeof q.id !== 'string') {
          throw new Error(`La pregunta ${index + 1} no tiene un ID válido`);
        }
        if (!q.text || typeof q.text !== 'string' || q.text.trim() === '') {
          throw new Error(`La pregunta ${index + 1} no tiene un texto válido`);
        }
        if (!Array.isArray(q.options) || q.options.length === 0) {
          throw new Error(`La pregunta ${index + 1} no tiene opciones válidas`);
        }
        if (!q.correctAnswer || !q.options.includes(q.correctAnswer)) {
          throw new Error(`La pregunta ${index + 1} no tiene una respuesta correcta válida`);
        }
      });

      console.log('Test validado y cargado correctamente:', {
        id: fetchedTest.id,
        numQuestions: fetchedTest.questions.length
      });
      
      setTest(fetchedTest);
      if (fetchedTest.timeLimit) {
        setTimeLeft(fetchedTest.timeLimit * 60);
      }
    } catch (error) {
      console.error('Error al cargar el test:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cargar el test');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    if (!questionId || typeof answer !== 'string') {
      console.error('Datos de respuesta inválidos:', { questionId, answer });
      return;
    }

    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const validateAnswers = (questions: Question[], currentAnswers: Record<string, string>): boolean => {
    return questions.every(q => {
      const answer = currentAnswers[q.id];
      return typeof answer === 'string' && answer.length > 0;
    });
  };

  const calculateScore = (questions: Question[], currentAnswers: Record<string, string>): number => {
    const correctAnswers = questions.filter(q => currentAnswers[q.id] === q.correctAnswer).length;
    return (correctAnswers / questions.length) * 100;
  };

  const handleSubmitTest = async () => {
    if (submitting) {
      console.log('Ya se está enviando el test, ignorando nueva solicitud');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Iniciando envío del test');

      // Validaciones previas al envío
      if (!test) {
        console.error('No hay un test cargado para enviar');
        toast.error('El test no está cargado correctamente.');
        return;
      }

      if (!test.id) {
        console.error('Test sin ID válido:', test);
        toast.error('El test no tiene un ID válido.');
        return;
      }

      if (!currentUser) {
        console.error('Usuario no autenticado');
        toast.error('No hay un usuario autenticado');
        return;
      }

      if (!testId || testId !== test.id) {
        console.error('Discrepancia en IDs del test:', { urlId: testId, testId: test.id });
        toast.error('ID del test no válido o no coincide');
        return;
      }

      // Validar que tenemos todas las respuestas necesarias
      if (test.questions && !validateAnswers(test.questions, answers)) {
        console.log('Respuestas incompletas:', answers);
        toast.warning('Debes responder todas las preguntas antes de enviar el test');
        return;
      }

      // Calcular y validar puntuación
      const percentage = calculateScore(test.questions, answers);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        console.error('Error al calcular la puntuación del test');
        toast.error('Error al calcular la puntuación del test');
        return;
      }

      console.log('Enviando resultados del test:', {
        testId,
        userId: currentUser.uid,
        numAnswers: Object.keys(answers).length,
        score: percentage
      });

      // Enviar resultados
      await testService.submitTest({
        testId,
        userId: currentUser.uid,
        answers,
        score: percentage,
      });

      setScore(percentage);
      toast.success('Test enviado correctamente');
      console.log('Test enviado exitosamente con puntuación:', percentage);
    } catch (error) {
      console.error('Error al enviar el test:', error);
      toast.error(error instanceof Error ? error.message : 'Error al enviar el test');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-8 text-red-600">
          Error al cargar el test
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{test.name}</h2>
            <p className="text-gray-600 mt-2">{test.description}</p>
          </div>
          {timeLeft !== null && (
            <div className="text-lg font-semibold text-gray-700">
              Tiempo restante: {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {test.questions.map((question, index) => (
            question && question.id ? (
              <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800 mb-3">
                  {index + 1}. {question.text}
                </p>
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className="flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={() => handleAnswerChange(question.id, option)}
                        className="mr-3 h-4 w-4 text-[#91c26a] focus:ring-[#91c26a]"
                        disabled={score !== null}
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div key={index} className="p-4 bg-red-50 rounded-lg text-red-600">
                Pregunta inválida o sin datos.
              </div>
            )
          ))}
        </div>

        <button
          onClick={handleSubmitTest}
          disabled={score !== null || submitting}
          className="mt-8 w-full bg-[#91c26a] text-white px-6 py-3 rounded-lg 
                   hover:bg-[#7ea756] transition-colors duration-200 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   font-medium text-lg"
        >
          {submitting ? 'Enviando...' : score !== null ? 'Test Enviado' : 'Enviar Test'}
        </button>

        {score !== null && (
          <div className="mt-8 p-6 bg-green-50 rounded-lg">
            <h3 className="text-xl font-bold text-green-800 mb-2">Resultados</h3>
            <p className="text-green-700 text-lg">
              Puntuación: {score.toFixed(1)}%
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 text-[#91c26a] hover:text-[#7ea756] font-medium"
            >
              Volver al Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestTakingPage;

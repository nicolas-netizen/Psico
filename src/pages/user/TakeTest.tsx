import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { Test, Question, TestResult } from '../../types/Test';
import { toast } from 'react-toastify';
import { FiClock, FiHelpCircle, FiArrowLeft, FiArrowRight, FiCheck } from 'react-icons/fi';

const TakeTest: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);

  useEffect(() => {
    loadTest();
  }, [testId]);

  useEffect(() => {
    if (testStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (testStarted && timeLeft === 0) {
      handleTestSubmit();
    }
  }, [timeLeft, testStarted]);

  const loadTest = async () => {
    try {
      if (!testId) return;

      const testDoc = await getDoc(doc(db, 'tests', testId));
      if (!testDoc.exists()) {
        toast.error('Test no encontrado');
        navigate('/dashboard');
        return;
      }

      const testData = { id: testDoc.id, ...testDoc.data() } as Test;
      setTest(testData);

      // Calcular tiempo total
      const totalTime = testData.blockConfigs.reduce((acc, config) => acc + config.timeLimit, 0);
      setTimeLeft(totalTime * 60); // Convertir a segundos

      // Cargar preguntas
      const questionsQuery = query(
        collection(db, 'questions'),
        where('status', '==', 'active')
      );
      const questionsSnapshot = await getDocs(questionsQuery);
      const questionsData = questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Question[];

      // Filtrar y ordenar preguntas por bloque
      const selectedQuestions: Question[] = [];
      testData.blockConfigs.forEach(config => {
        const blockQuestions = questionsData
          .filter(q => q.block === config.block)
          .sort(() => Math.random() - 0.5)
          .slice(0, config.questionCount);
        selectedQuestions.push(...blockQuestions);
      });

      setQuestions(selectedQuestions);
      setLoading(false);
    } catch (error) {
      console.error('Error loading test:', error);
      toast.error('Error al cargar el test');
    }
  };

  const handleStartTest = () => {
    setTestStarted(true);
    toast.info('¡El test ha comenzado! ¡Buena suerte!');
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleTestSubmit = async () => {
    try {
      if (!test || !currentUser) return;

      // Calcular resultados
      const results = questions.map(question => ({
        questionId: question.id,
        selectedAnswer: selectedAnswers[question.id] ?? -1,
        isCorrect: selectedAnswers[question.id] === question.answers.findIndex(a => a.isCorrect)
      }));

      // Calcular puntuaciones por bloque
      const blockScores = test.blockConfigs.map(config => {
        const blockQuestions = questions.filter(q => q.block === config.block);
        const correct = blockQuestions.filter(q => 
          results.find(r => r.questionId === q.id)?.isCorrect
        ).length;
        return {
          block: config.block,
          correct,
          total: blockQuestions.length
        };
      });

      // Calcular puntuación total
      const totalCorrect = results.filter(r => r.isCorrect).length;
      const totalScore = (totalCorrect / questions.length) * 100;

      const testResult: Partial<TestResult> = {
        testId: test.id!,
        userId: currentUser.uid,
        answers: results,
        blockScores,
        totalScore,
        startedAt: Timestamp.now(),
        finishedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'testResults'), testResult);
      toast.success('Test completado exitosamente');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Error al enviar el test');
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{test?.title}</h1>
            <p className="text-gray-600 mb-6">{test?.description}</p>

            <div className="space-y-4 mb-8">
              <h2 className="text-lg font-semibold text-gray-900">Instrucciones:</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Lee cada pregunta cuidadosamente antes de responder</li>
                <li>Puedes navegar entre las preguntas usando los botones o el panel de navegación</li>
                <li>El tiempo comenzará a correr una vez que inicies el test</li>
                <li>El test se enviará automáticamente cuando se acabe el tiempo</li>
              </ul>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bloques del Test:</h3>
                <div className="space-y-2">
                  {test?.blockConfigs.map((config, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <span className="text-gray-700">{config.block}</span>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{config.questionCount} preguntas</span>
                        <span>{config.timeLimit} minutos</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleStartTest}
              className="w-full bg-[#91c26a] text-white py-3 px-6 rounded-lg hover:bg-[#7ea756] transition duration-300 flex items-center justify-center"
            >
              <FiCheck className="mr-2" /> Comenzar Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Barra superior */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              Pregunta {currentQuestionIndex + 1} de {questions.length}
            </span>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center text-gray-600">
              <FiClock className="mr-2" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
          <button
            onClick={handleTestSubmit}
            className="bg-[#91c26a] text-white px-4 py-2 rounded-md hover:bg-[#7ea756] transition duration-300"
          >
            Finalizar Test
          </button>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Panel de navegación */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Navegación</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-full aspect-square rounded-md flex items-center justify-center text-sm font-medium ${
                      index === currentQuestionIndex
                        ? 'bg-[#91c26a] text-white'
                        : selectedAnswers[questions[index].id] !== undefined
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pregunta actual */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {currentQuestion.title}
                </h2>
                {currentQuestion.imageUrl && (
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Imagen de la pregunta"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
              </div>

              <div className="space-y-3">
                {currentQuestion.answers.map((answer, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQuestion.id!, index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition duration-300 ${
                      selectedAnswers[currentQuestion.id!] === index
                        ? 'border-[#91c26a] bg-[#f3f9f0]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                        selectedAnswers[currentQuestion.id!] === index
                          ? 'border-[#91c26a] bg-[#91c26a]'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswers[currentQuestion.id!] === index && (
                          <FiCheck className="text-white" />
                        )}
                      </div>
                      <span className="text-gray-900">{answer.text}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    currentQuestionIndex === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FiArrowLeft className="mr-2" /> Anterior
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    currentQuestionIndex === questions.length - 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#91c26a] text-white hover:bg-[#7ea756]'
                  }`}
                >
                  Siguiente <FiArrowRight className="ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeTest;

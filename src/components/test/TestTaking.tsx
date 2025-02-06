import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { Question, Test, BlockConfig } from '../../types/Test';
import { useNavigate } from 'react-router-dom';

interface TestTakingProps {
  testId: string;
  onComplete: (results: any) => void;
}

const TestTaking: React.FC<TestTakingProps> = ({ testId, onComplete }) => {
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showingMathQuestion, setShowingMathQuestion] = useState(false);
  const [mathAnswer, setMathAnswer] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Cargar el test y las preguntas
  useEffect(() => {
    const loadTest = async () => {
      try {
        const testDoc = await getDoc(doc(db, 'tests', testId));
        if (!testDoc.exists()) {
          throw new Error('Test no encontrado');
        }

        const testData = { id: testDoc.id, ...testDoc.data() } as Test;
        setTest(testData);

        // Cargar preguntas para el bloque actual
        await loadQuestionsForCurrentBlock(testData, 0);
      } catch (error) {
        console.error('Error al cargar el test:', error);
      }
    };

    loadTest();
  }, [testId]);

  const loadQuestionsForCurrentBlock = async (testData: Test, blockIndex: number) => {
    try {
      setLoading(true);
      const currentBlock = testData.blockConfigs[blockIndex].block;
      const questionCount = testData.blockConfigs[blockIndex].questionCount;

      const q = query(
        collection(db, 'questions'),
        where('block', '==', currentBlock),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      let availableQuestions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Question[];

      // Seleccionar aleatoriamente el número requerido de preguntas
      const selectedQuestions = [];
      while (selectedQuestions.length < questionCount && availableQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        selectedQuestions.push(availableQuestions[randomIndex]);
        availableQuestions.splice(randomIndex, 1);
      }

      setQuestions(selectedQuestions);
      setTimeLeft(testData.blockConfigs[blockIndex].timeLimit * 60);
      setCurrentQuestionIndex(0);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar las preguntas:', error);
      setLoading(false);
    }
  };

  // Temporizador
  useEffect(() => {
    if (!loading && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleBlockComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, timeLeft]);

  const handleAnswer = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));

    // Si es la última pregunta, esperar un momento antes de continuar
    if (currentQuestionIndex === questions.length - 1) {
      if (test?.blockConfigs[currentBlockIndex].block === 'MEMORIA') {
        setShowingMathQuestion(true);
      } else {
        handleBlockComplete();
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleMathAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion.mathQuestion?.answer === mathAnswer.trim()) {
      // Respuesta correcta, continuar al siguiente bloque
      handleBlockComplete();
    } else {
      // Respuesta incorrecta, mostrar mensaje y continuar
      alert('Respuesta incorrecta. Continuando con el siguiente bloque...');
      handleBlockComplete();
    }
  };

  const handleBlockComplete = () => {
    if (currentBlockIndex < (test?.blockConfigs.length || 0) - 1) {
      setCurrentBlockIndex(prev => prev + 1);
      loadQuestionsForCurrentBlock(test!, currentBlockIndex + 1);
      setShowingMathQuestion(false);
      setMathAnswer('');
    } else {
      // Test completado
      calculateResults();
    }
  };

  const calculateResults = () => {
    const results = {
      testId,
      userId: currentUser?.uid,
      answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
        isCorrect: questions.find(q => q.id === questionId)?.answers[selectedAnswer].isCorrect || false
      })),
      blockScores: test?.blockConfigs.map(config => {
        const blockQuestions = questions.filter(q => q.block === config.block);
        const correct = blockQuestions.filter(q => 
          answers[q.id] !== undefined && 
          q.answers[answers[q.id]].isCorrect
        ).length;
        return {
          block: config.block,
          correct,
          total: blockQuestions.length
        };
      }),
      totalScore: 0,
      startedAt: new Date(),
      finishedAt: new Date()
    };

    // Calcular puntuación total
    const totalCorrect = results.answers.filter(a => a.isCorrect).length;
    const totalQuestions = results.answers.length;
    results.totalScore = (totalCorrect / totalQuestions) * 100;

    onComplete(results);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentBlock = test?.blockConfigs[currentBlockIndex];

  if (showingMathQuestion && currentQuestion.mathQuestion) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Pregunta de Matemáticas</h2>
          <p className="text-lg mb-4">{currentQuestion.mathQuestion.question}</p>
          <div className="space-y-4">
            <input
              type="text"
              value={mathAnswer}
              onChange={(e) => setMathAnswer(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
              placeholder="Tu respuesta..."
            />
            <button
              onClick={handleMathAnswer}
              className="w-full bg-[#91c26a] hover:bg-[#7ea756] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Verificar Respuesta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Bloque: {currentBlock?.block}
          </h2>
          <p className="text-gray-600">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </p>
        </div>
        <div className="text-xl font-semibold">
          Tiempo: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        {currentQuestion && (
          <>
            <div className="mb-8">
              <h3 className="text-xl font-medium mb-4">{currentQuestion.title}</h3>
              {currentQuestion.imageUrl && (
                <img
                  src={currentQuestion.imageUrl}
                  alt="Imagen de la pregunta"
                  className="max-w-full h-auto rounded-lg mb-4"
                />
              )}
            </div>

            <div className="space-y-4">
              {currentQuestion.answers.map((answer, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(currentQuestion.id!, index)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                    answers[currentQuestion.id!] === index
                      ? 'border-[#91c26a] bg-[#91c26a] bg-opacity-10'
                      : 'border-gray-200 hover:border-[#91c26a]'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-lg">{answer.text}</span>
                    {answer.imageUrl && (
                      <img
                        src={answer.imageUrl}
                        alt={`Respuesta ${index + 1}`}
                        className="h-20 w-auto rounded"
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TestTaking;

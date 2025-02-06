import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { Question, QuestionBlock, QuestionFormat, Answer } from '../../types/Test';
import { toast } from 'react-toastify';

const DEFAULT_ANSWER: Answer = {
  text: '',
  isCorrect: false
};

const QuestionManagement: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    title: '',
    block: QuestionBlock.VERBAL,
    format: 'MULTIPLE_CHOICE',
    answers: [{ ...DEFAULT_ANSWER }],
    status: 'active'
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const questionsSnapshot = await getDocs(collection(db, 'questions'));
      const questionsData = questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Question[];
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error al cargar las preguntas:', error);
      toast.error('Error al cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnswer = () => {
    setNewQuestion(prev => ({
      ...prev,
      answers: [...(prev.answers || []), { ...DEFAULT_ANSWER }]
    }));
  };

  const handleRemoveAnswer = (index: number) => {
    setNewQuestion(prev => ({
      ...prev,
      answers: prev.answers?.filter((_, i) => i !== index)
    }));
  };

  const handleAnswerChange = (index: number, field: keyof Answer, value: any) => {
    setNewQuestion(prev => {
      const newAnswers = [...(prev.answers || [])];
      newAnswers[index] = {
        ...newAnswers[index],
        [field]: value
      };
      return { ...prev, answers: newAnswers };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const questionData = {
        ...newQuestion,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'questions'), questionData);
      toast.success('Pregunta creada exitosamente');
      
      setNewQuestion({
        title: '',
        block: QuestionBlock.VERBAL,
        format: 'MULTIPLE_CHOICE',
        answers: [{ ...DEFAULT_ANSWER }],
        status: 'active'
      });
      
      loadQuestions();
    } catch (error) {
      console.error('Error al crear la pregunta:', error);
      toast.error('Error al crear la pregunta');
    }
  };

  const handleUpdateQuestion = async (questionId: string, updates: Partial<Question>) => {
    try {
      const questionRef = doc(db, 'questions', questionId);
      await updateDoc(questionRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      toast.success('Pregunta actualizada exitosamente');
      loadQuestions();
    } catch (error) {
      console.error('Error al actualizar la pregunta:', error);
      toast.error('Error al actualizar la pregunta');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
      try {
        await deleteDoc(doc(db, 'questions', questionId));
        toast.success('Pregunta eliminada exitosamente');
        loadQuestions();
      } catch (error) {
        console.error('Error al eliminar la pregunta:', error);
        toast.error('Error al eliminar la pregunta');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Formulario para crear nueva pregunta */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Crear Nueva Pregunta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Título/Pregunta</label>
            <input
              type="text"
              value={newQuestion.title}
              onChange={(e) => setNewQuestion(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bloque</label>
            <select
              value={newQuestion.block}
              onChange={(e) => setNewQuestion(prev => ({ ...prev, block: e.target.value as QuestionBlock }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
            >
              {Object.values(QuestionBlock).map((block) => (
                <option key={block} value={block}>
                  {block}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Formato</label>
            <select
              value={newQuestion.format}
              onChange={(e) => setNewQuestion(prev => ({ ...prev, format: e.target.value as QuestionFormat }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
            >
              <option value="MULTIPLE_CHOICE">Opción Múltiple</option>
              <option value="TRUE_FALSE">Verdadero/Falso</option>
              <option value="SHORT_ANSWER">Respuesta Corta</option>
              <option value="OPEN_ANSWER">Respuesta Abierta</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">Respuestas</label>
              <button
                type="button"
                onClick={handleAddAnswer}
                className="px-3 py-1 text-sm bg-[#91c26a] text-white rounded-md hover:bg-[#7ea756]"
              >
                Agregar Respuesta
              </button>
            </div>
            
            <div className="space-y-4">
              {newQuestion.answers?.map((answer, index) => (
                <div key={index} className="flex gap-4 items-start p-4 border rounded-lg">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={answer.text}
                      onChange={(e) => handleAnswerChange(index, 'text', e.target.value)}
                      placeholder="Texto de la respuesta"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={answer.isCorrect}
                      onChange={(e) => handleAnswerChange(index, 'isCorrect', e.target.checked)}
                      className="h-4 w-4 text-[#91c26a] focus:ring-[#91c26a] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">Correcta</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveAnswer(index)}
                    className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#91c26a] text-white px-4 py-2 rounded-md hover:bg-[#7ea756]"
            >
              Crear Pregunta
            </button>
          </div>
        </form>
      </div>

      {/* Lista de preguntas existentes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Preguntas Existentes</h2>
        </div>
        <div className="divide-y">
          {questions.map((question) => (
            <div key={question.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{question.title}</h3>
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <span className="text-gray-500">Bloque: {question.block}</span>
                    <span className="text-gray-500">Formato: {question.format}</span>
                    <span className="text-gray-500">Estado: {question.status}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUpdateQuestion(question.id!, { status: question.status === 'active' ? 'inactive' : 'active' })}
                    className={`px-3 py-1 rounded-md text-sm ${
                      question.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {question.status === 'active' ? 'Activo' : 'Inactivo'}
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id!)}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {question.answers.map((answer, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md ${
                      answer.isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    } border`}
                  >
                    <div className="text-sm">{answer.text}</div>
                    {answer.isCorrect && (
                      <div className="mt-1 text-xs text-green-600 font-medium">
                        Respuesta correcta
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionManagement;

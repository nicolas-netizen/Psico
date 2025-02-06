import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-toastify';
import QuestionForm from '../../components/admin/QuestionForm';
import { Question } from '../../types/Test';

const QuestionManagement: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const q = query(collection(db, 'questions'));
      const querySnapshot = await getDocs(q);
      const questionData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Question[];
      
      setQuestions(questionData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error al cargar las preguntas:', error);
      toast.error('Error al cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (questionId: string, newStatus: 'active' | 'inactive') => {
    try {
      await updateDoc(doc(db, 'questions', questionId), {
        status: newStatus,
        updatedAt: new Date()
      });
      toast.success('Estado actualizado exitosamente');
      fetchQuestions();
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) return;

    try {
      await deleteDoc(doc(db, 'questions', questionId));
      toast.success('Pregunta eliminada exitosamente');
      fetchQuestions();
    } catch (error) {
      console.error('Error al eliminar la pregunta:', error);
      toast.error('Error al eliminar la pregunta');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Gestión de Preguntas</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#91c26a] hover:bg-[#7ea756] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Crear Nueva Pregunta
        </button>
      </div>

      {/* Lista de Preguntas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questions.map(question => (
          <div
            key={question.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-[1.02]"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{question.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {question.block}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {question.format}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      question.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {question.status === 'active' ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vista previa de la pregunta */}
              {question.imageUrl && (
                <div className="mb-4">
                  <img
                    src={question.imageUrl}
                    alt="Imagen de la pregunta"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Respuestas */}
              <div className="space-y-2 mb-4">
                {question.answers.map((answer, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg ${
                      answer.isCorrect
                        ? 'bg-green-100 border border-green-300'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{answer.text}</span>
                      {answer.isCorrect && (
                        <span className="text-green-600 text-sm font-medium">✓ Correcta</span>
                      )}
                    </div>
                    {answer.imageUrl && (
                      <img
                        src={answer.imageUrl}
                        alt={`Respuesta ${index + 1}`}
                        className="mt-2 h-20 object-cover rounded"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Pregunta de matemáticas para bloque de memoria */}
              {question.block === 'MEMORIA' && question.mathQuestion && (
                <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">
                    Pregunta matemática: {question.mathQuestion.question}
                  </p>
                  <p className="text-sm text-yellow-600">
                    Respuesta: {question.mathQuestion.answer}
                  </p>
                </div>
              )}

              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => handleStatusChange(
                    question.id!,
                    question.status === 'active' ? 'inactive' : 'active'
                  )}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    question.status === 'active'
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {question.status === 'active' ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => handleDeleteQuestion(question.id!)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para crear pregunta */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">Crear Nueva Pregunta</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <QuestionForm
                onQuestionCreated={() => {
                  setShowForm(false);
                  fetchQuestions();
                  toast.success('Pregunta creada exitosamente');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;

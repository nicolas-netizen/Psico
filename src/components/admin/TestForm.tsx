import React, { useState } from 'react';
import { Plus, Save } from 'lucide-react';

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
}

const TestForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', options: ['', '', '', ''], correctAnswer: 0 }
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement test creation
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 font-outfit">Crear Nuevo Test</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Título del Test
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
        </div>

        {questions.map((question, qIndex) => (
          <div key={qIndex} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pregunta {qIndex + 1}
              </label>
              <input
                type="text"
                value={question.text}
                onChange={(e) => {
                  const newQuestions = [...questions];
                  newQuestions[qIndex].text = e.target.value;
                  setQuestions(newQuestions);
                }}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.options.map((option, oIndex) => (
                <div key={oIndex}>
                  <label className="block text-sm font-medium text-gray-700">
                    Opción {oIndex + 1}
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newQuestions = [...questions];
                        newQuestions[qIndex].options[oIndex] = e.target.value;
                        setQuestions(newQuestions);
                      }}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      required
                    />
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={question.correctAnswer === oIndex}
                      onChange={() => {
                        const newQuestions = [...questions];
                        newQuestions[qIndex].correctAnswer = oIndex;
                        setQuestions(newQuestions);
                      }}
                      className="ml-2 h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir Pregunta
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Test
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestForm;
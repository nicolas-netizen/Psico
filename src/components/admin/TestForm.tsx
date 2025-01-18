import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Test, 
  TestQuestion,
  AptitudeCategory,
  Aptitude,
  QuestionType
} from '../../types/Test';
import { Plan, getPlans } from '../../services/firestore';
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const APTITUDE_CATEGORIES = {
  VERBAL: [
    AptitudeCategory.SYNONYMS,
    AptitudeCategory.ANTONYMS,
    AptitudeCategory.VERBAL_ANALOGIES,
    AptitudeCategory.SPELLING,
    AptitudeCategory.PROVERBS
  ],
  NUMERICAL: [
    AptitudeCategory.BASIC_OPERATIONS,
    AptitudeCategory.REASONING_PROBLEMS,
    AptitudeCategory.AREA_PERIMETER_CALCULATION,
    AptitudeCategory.DECIMAL_FRACTION_OPERATIONS,
    AptitudeCategory.PROPORTIONS,
    AptitudeCategory.PERCENTAGES
  ],
  SPATIAL: [
    AptitudeCategory.FIGURE_FOLDING,
    AptitudeCategory.PERSPECTIVE_VISUALIZATION,
    AptitudeCategory.FIGURE_ROTATION,
    AptitudeCategory.BLOCK_COUNTING
  ],
  MECHANICAL: [
    AptitudeCategory.PHYSICAL_MECHANICAL_TESTS,
    AptitudeCategory.MECHANISMS,
    AptitudeCategory.BALANCE_SYSTEMS,
    AptitudeCategory.PULLEYS,
    AptitudeCategory.GEARS
  ],
  PERCEPTUAL: [
    AptitudeCategory.FILE_ORGANIZATION,
    AptitudeCategory.ALPHABETICAL_ORDERING,
    AptitudeCategory.FATIGUE_RESISTANCE,
    AptitudeCategory.ERROR_DETECTION
  ]
};

interface TestFormProps {
  test?: Test | null;
  onClose: () => void;
  onSave: (test: Test) => void;
  isCreating: boolean;
}

const TestForm: React.FC<TestFormProps> = ({ test: initialTest, onClose, onSave, isCreating }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [test, setTest] = useState<Partial<Test>>({
    title: initialTest?.title || '',
    description: initialTest?.description || '',
    questions: initialTest?.questions || [],
    plans: initialTest?.plans || [],
    category: initialTest?.category || '',
    timeLimit: initialTest?.timeLimit || 30,
    categories: initialTest?.categories || []
  });
  const [currentQuestion, setCurrentQuestion] = useState<Partial<TestQuestion>>({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  });
  const [selectedAptitude, setSelectedAptitude] = useState<string>(initialTest?.category || '');
  const [selectedCategories, setSelectedCategories] = useState<AptitudeCategory[]>(initialTest?.categories || []);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const fetchedPlans = await getPlans();
        setPlans(fetchedPlans);
      } catch (error) {
        toast.error('Error al cargar los planes');
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (initialTest) {
      setTest({
        ...initialTest,
        questions: initialTest.questions || []
      });
      setSelectedAptitude(initialTest.category || '');
      setSelectedCategories(initialTest.categories || []);
    }
  }, [initialTest]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTest(prev => ({ ...prev, [name]: value }));
  };

  const handleAptitudeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const aptitude = e.target.value;
    setSelectedAptitude(aptitude);
    setSelectedCategories([]);
    setTest(prev => ({ ...prev, category: aptitude }));
  };

  const handleCategoryToggle = (category: AptitudeCategory) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      }
      return [...prev, category];
    });
  };

  const handlePlanToggle = (planId: string) => {
    setTest(prev => {
      const plans = prev.plans || [];
      if (plans.includes(planId)) {
        return { ...prev, plans: plans.filter(id => id !== planId) };
      }
      return { ...prev, plans: [...plans, planId] };
    });
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index?: number) => {
    const { name, value } = e.target;
    if (typeof index === 'number') {
      setCurrentQuestion(prev => ({
        ...prev,
        options: prev.options?.map((opt, i) => i === index ? value : opt)
      }));
    } else {
      setCurrentQuestion(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones
      if (!test.title || !test.description || !test.category || !test.plans?.length) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      if (!test.questions?.length) {
        toast.error('Debes agregar al menos una pregunta al test');
        return;
      }

      // Validar que cada pregunta tenga texto y opciones válidas
      const invalidQuestions = test.questions.some(q => 
        !q.text || q.options.some(opt => !opt) || q.correctAnswer === undefined
      );

      if (invalidQuestions) {
        toast.error('Todas las preguntas deben tener texto, opciones y una respuesta correcta');
        return;
      }

      const testData = {
        ...test,
        updatedAt: new Date(),
        categories: selectedCategories,
      };

      if (isCreating) {
        testData.createdAt = new Date();
        testData.status = 'active';
        const docRef = await addDoc(collection(db, 'tests'), testData);
        onSave({ ...testData, id: docRef.id } as Test);
      } else if (initialTest?.id) {
        await updateDoc(doc(db, 'tests', initialTest.id), testData);
        onSave({ ...testData, id: initialTest.id } as Test);
      }
      
      toast.success(isCreating ? 'Test creado exitosamente' : 'Test actualizado exitosamente');
      onClose();
    } catch (error) {
      console.error('Error al guardar el test:', error);
      toast.error('Error al guardar el test');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSubmit = () => {
    if (!currentQuestion.text || currentQuestion.options?.some(opt => !opt)) {
      toast.error('La pregunta debe tener texto y todas las opciones completadas');
      return;
    }

    if (currentQuestion.correctAnswer === undefined) {
      toast.error('Debes seleccionar una respuesta correcta');
      return;
    }

    setTest(prev => ({
      ...prev,
      questions: [...(prev.questions || []), currentQuestion as TestQuestion]
    }));

    // Limpiar el formulario de pregunta actual
    setCurrentQuestion({
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    });

    toast.success('Pregunta agregada exitosamente');
  };

  const handleRemoveQuestion = (index: number) => {
    setTest(prev => ({
      ...prev,
      questions: prev.questions?.filter((_, i) => i !== index) || []
    }));
    toast.success('Pregunta eliminada');
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            {isCreating ? 'Crear Nuevo Test' : 'Editar Test'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Título</label>
              <input
                type="text"
                name="title"
                value={test.title}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                name="description"
                value={test.description}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tiempo límite (minutos)</label>
              <input
                type="number"
                name="timeLimit"
                value={test.timeLimit}
                onChange={handleInputChange}
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Aptitud</label>
              <select
                value={selectedAptitude}
                onChange={handleAptitudeChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">Selecciona una aptitud</option>
                {Object.keys(APTITUDE_CATEGORIES).map(aptitude => (
                  <option key={aptitude} value={aptitude}>
                    {aptitude}
                  </option>
                ))}
              </select>
            </div>

            {selectedAptitude && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categorías de {selectedAptitude}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {APTITUDE_CATEGORIES[selectedAptitude as keyof typeof APTITUDE_CATEGORIES].map(category => (
                    <label key={category} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Planes</label>
              <div className="grid grid-cols-2 gap-2">
                {plans.map(plan => (
                  <label key={plan.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={test.plans?.includes(plan.id)}
                      onChange={() => handlePlanToggle(plan.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{plan.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Preguntas existentes */}
          {test.questions && test.questions.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Preguntas Existentes</h3>
              <div className="space-y-4">
                {test.questions.map((question, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Pregunta {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </div>
                    <p className="text-gray-700 mb-2">{question.text}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-2 rounded ${
                            question.correctAnswer === optIndex
                              ? 'bg-green-100 border-green-500'
                              : 'bg-gray-50'
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nueva pregunta */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Nueva Pregunta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Pregunta</label>
                <input
                  type="text"
                  name="text"
                  value={currentQuestion.text}
                  onChange={handleQuestionChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options?.map((option, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700">
                      Opción {index + 1}
                    </label>
                    <div className="mt-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleQuestionChange(e, index)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={currentQuestion.correctAnswer === index}
                        onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: index }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleQuestionSubmit}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Agregar Pregunta
              </button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : isCreating ? 'Crear Test' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestForm;
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
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
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

const TestForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [test, setTest] = useState<Partial<Test>>({
    title: '',
    description: '',
    questions: [],
    plans: [],
    category: '',
    timeLimit: 30
  });
  const [currentQuestion, setCurrentQuestion] = useState<Partial<TestQuestion>>({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  });
  const [selectedAptitude, setSelectedAptitude] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<AptitudeCategory[]>([]);

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
      if (!test.title || !test.description || !test.category || test.plans.length === 0) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      if (test.questions.length === 0) {
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
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
        categories: selectedCategories,
      };

      const docRef = await addDoc(collection(db, 'tests'), testData);
      
      toast.success('Test creado exitosamente');
      navigate('/admin');
    } catch (error) {
      console.error('Error al crear el test:', error);
      toast.error('Error al crear el test');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSubmit = () => {
    if (!currentQuestion.text || currentQuestion.options.some(opt => !opt)) {
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Crear Nuevo Test</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Título</label>
          <input
            type="text"
            name="title"
            value={test.title}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            name="description"
            value={test.description}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Aptitud</label>
          <select
            value={selectedAptitude}
            onChange={handleAptitudeChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Seleccione una aptitud</option>
            {Object.keys(APTITUDE_CATEGORIES).map(aptitude => (
              <option key={aptitude} value={aptitude}>
                {aptitude}
              </option>
            ))}
          </select>
        </div>

        {selectedAptitude && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categorías</label>
            <div className="grid grid-cols-2 gap-2">
              {APTITUDE_CATEGORIES[selectedAptitude as keyof typeof APTITUDE_CATEGORIES].map(category => (
                <label key={category} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{category}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Planes Asociados</label>
          <div className="grid grid-cols-2 gap-2">
            {plans.map(plan => (
              <label key={plan.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={test.plans?.includes(plan.id)}
                  onChange={() => handlePlanToggle(plan.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{plan.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Agregar Pregunta</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Pregunta</label>
              <input
                type="text"
                name="text"
                value={currentQuestion.text}
                onChange={handleQuestionChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Opciones</label>
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleQuestionChange(e, index)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder={`Opción ${index + 1}`}
                  />
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={currentQuestion.correctAnswer === index}
                    onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: index }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleQuestionSubmit}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Agregar Pregunta
            </button>
          </div>
        </div>

        {test.questions && test.questions.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Preguntas Agregadas</h3>
            <div className="space-y-4">
              {test.questions.map((question, index) => (
                <div key={question.id} className="p-4 bg-gray-50 rounded-md">
                  <p className="font-medium">{index + 1}. {question.text}</p>
                  <ul className="mt-2 space-y-1">
                    {question.options.map((option, optIndex) => (
                      <li key={optIndex} className={optIndex === question.correctAnswer ? 'text-green-600' : ''}>
                        {optIndex + 1}. {option}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {loading ? 'Guardando...' : 'Guardar Test'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestForm;
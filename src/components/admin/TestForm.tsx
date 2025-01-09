import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Test, 
  TestQuestion, 
  AptitudeCategory, 
  Aptitude 
} from '../../types/Test';
import api from '../../services/api';
import { Trash2, Plus } from 'lucide-react';

// Agrupación de categorías por aptitud
const APTITUDE_CATEGORIES = {
  [Aptitude.LINGUISTIC_INTELLIGENCE]: [
    AptitudeCategory.SYNONYMS,
    AptitudeCategory.ANTONYMS,
    AptitudeCategory.VERBAL_ANALOGIES,
    AptitudeCategory.SPELLING,
    AptitudeCategory.PROVERBS
  ],
  [Aptitude.MATHEMATICAL_LOGIC]: [
    AptitudeCategory.BASIC_OPERATIONS,
    AptitudeCategory.REASONING_PROBLEMS,
    AptitudeCategory.AREA_PERIMETER_CALCULATION,
    AptitudeCategory.DECIMAL_FRACTION_OPERATIONS,
    AptitudeCategory.PROPORTIONS,
    AptitudeCategory.PERCENTAGES
  ],
  [Aptitude.SPATIAL_INTELLIGENCE]: [
    AptitudeCategory.FIGURE_FOLDING,
    AptitudeCategory.PERSPECTIVE_VISUALIZATION,
    AptitudeCategory.FIGURE_ROTATION,
    AptitudeCategory.BLOCK_COUNTING
  ],
  [Aptitude.BODILY_KINESTHETIC]: [
    AptitudeCategory.PHYSICAL_MECHANICAL_TESTS,
    AptitudeCategory.MECHANISMS,
    AptitudeCategory.BALANCE_SYSTEMS,
    AptitudeCategory.PULLEYS,
    AptitudeCategory.GEARS
  ],
  [Aptitude.INTRAPERSONAL_INTELLIGENCE]: [
    AptitudeCategory.FILE_ORGANIZATION,
    AptitudeCategory.ALPHABETICAL_ORDERING,
    AptitudeCategory.FATIGUE_RESISTANCE,
    AptitudeCategory.ERROR_DETECTION
  ]
};

interface TestFormProps {
  initialTest?: Test | null;
  onTestCreated?: (test: Test) => void;
  onClose?: () => void;
}

const TestForm: React.FC<TestFormProps> = ({ 
  initialTest = null, 
  onTestCreated, 
  onClose 
}) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<Test>>({
    title: initialTest?.title || '',
    description: initialTest?.description || '',
    questions: initialTest?.questions || [],
    plans: initialTest?.plans || [],
    category: initialTest?.category || '',
    difficulty: initialTest?.difficulty || 'basic',
    timeLimit: initialTest?.timeLimit || 30,
    aptitudeCategory: initialTest?.aptitudeCategory || null
  });

  const [selectedAptitude, setSelectedAptitude] = useState<Aptitude | null>(
    initialTest?.category as Aptitude || null
  );

  useEffect(() => {
    // Fetch available plans when component mounts
    const fetchPlans = async () => {
      try {
        const fetchedPlans = await api.getPlans();
        setPlans(fetchedPlans);
      } catch (error) {
        toast.error('No se pudieron cargar los planes');
      }
    };

    fetchPlans();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAptitudeChange = (aptitude: Aptitude) => {
    setSelectedAptitude(aptitude);
    setFormData(prev => ({
      ...prev,
      category: aptitude,
      aptitudeCategory: null  // Reset specific category
    }));
  };

  const handleAptitudeCategoryChange = (category: AptitudeCategory) => {
    setFormData(prev => ({
      ...prev,
      aptitudeCategory: category
    }));
  };

  const handlePlanSelection = (planId: string) => {
    setFormData(prev => {
      const updatedPlans = prev.plans?.includes(planId)
        ? prev.plans?.filter(id => id !== planId)
        : [...(prev.plans || []), planId];
      
      return { ...prev, plans: updatedPlans };
    });
  };

  const addQuestion = () => {
    const newQuestion: TestQuestion = {
      id: `question-${Date.now()}`,
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    };

    setFormData(prev => ({

      ...prev,
      questions: [...(prev.questions || []), newQuestion]
    }));
  };

  const updateQuestion = (index: number, updates: Partial<TestQuestion>) => {
    const updatedQuestions = [...(formData.questions || [])];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };

    setFormData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = formData.questions?.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.title || !formData.description || 
        !formData.plans || formData.plans.length === 0 ||
        !formData.questions || formData.questions.length === 0) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    // Validate questions
    const invalidQuestions = formData.questions.some(q => 
      !q.text || q.options.some(opt => !opt)
    );

    if (invalidQuestions) {
      toast.error('Por favor complete todas las preguntas y opciones');
      return;
    }

    try {
      const testData: Partial<Test> = {
        ...formData,
        id: initialTest?.id || `test-${Date.now()}`,
        createdAt: initialTest?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let result;
      if (initialTest) {
        // Update existing test
        result = await api.updateTest(testData.id!, testData);
      } else {
        // Create new test
        result = await api.createTest(testData);
      }
      
      toast.success(initialTest ? 'Test actualizado exitosamente' : 'Test creado exitosamente');
      
      // Call callback if provided
      if (onTestCreated) {
        onTestCreated(result);
      }

      // Close the form
      if (onClose) {
        onClose();
      }
    } catch (error) {
      toast.error(initialTest ? 'Error al actualizar el test' : 'Error al crear el test');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700 font-medium mb-2">Título del Test</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ingrese el título del test"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">Descripción</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describa el test"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">Tiempo Límite (minutos)</label>
        <input
          type="number"
          name="timeLimit"
          value={formData.timeLimit}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          min={5}
          max={120}
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">Planes Disponibles</label>
        <div className="flex flex-wrap gap-2">
          {plans.length === 0 ? (
            <p className="text-gray-500">No hay planes disponibles</p>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`plan-${plan.id}`}
                  checked={formData.plans?.includes(plan.id)}
                  onChange={() => handlePlanSelection(plan.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label 
                  htmlFor={`plan-${plan.id}`} 
                  className="ml-2 block text-sm text-gray-900"
                >
                  {plan.name}
                </label>
              </div>
            )))
          }
        </div>
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">Aptitud</label>
        <div className="flex flex-wrap gap-2">
          {Object.values(Aptitude).map((aptitude) => (
            <button
              key={aptitude}
              type="button"
              onClick={() => handleAptitudeChange(aptitude)}
              className={`px-4 py-2 rounded ${
                selectedAptitude === aptitude 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {aptitude}
            </button>
          ))}
        </div>
      </div>

      {selectedAptitude && (
        <div>
          <label className="block text-gray-700 font-medium mb-2">Categoría de Aptitud</label>
          <div className="flex flex-wrap gap-2">
            {APTITUDE_CATEGORIES[selectedAptitude].map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleAptitudeCategoryChange(category)}
                className={`px-4 py-2 rounded ${
                  formData.aptitudeCategory === category 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-gray-700 font-medium">Preguntas</label>
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <Plus className="mr-1" size={16} /> Añadir Pregunta
          </button>
        </div>
        {formData.questions?.map((question, index) => (
          <div 
            key={question.id} 
            className="border border-gray-200 rounded-md p-4 mb-4 relative"
          >
            <button
              type="button"
              onClick={() => removeQuestion(index)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              <Trash2 size={16} />
            </button>
            <div className="mb-3">
              <label className="block text-gray-700 font-medium mb-2">Texto de la Pregunta</label>
              <input
                type="text"
                value={question.text}
                onChange={(e) => updateQuestion(index, { text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Escriba la pregunta"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Opciones</label>
              <div className="grid grid-cols-2 gap-2">
                {question.options.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...question.options];
                        newOptions[optIndex] = e.target.value;
                        updateQuestion(index, { options: newOptions });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Opción ${optIndex + 1}`}
                      required
                    />
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={question.correctAnswer === optIndex}
                      onChange={() => updateQuestion(index, { correctAnswer: optIndex })}
                      className="ml-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">Dificultad</label>
        <select
          name="difficulty"
          value={formData.difficulty}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="basic">Básico</option>
          <option value="intermediate">Intermedio</option>
          <option value="advanced">Avanzado</option>
        </select>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="w-full py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          {initialTest ? 'Actualizar Test' : 'Crear Test'}
        </button>
      </div>
    </form>
  );
};

export default TestForm;
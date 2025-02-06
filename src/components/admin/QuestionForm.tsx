import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { db } from '../../firebase/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { uploadImage } from '../../services/cloudinaryService';
import { 
  QuestionBlock, 
  QuestionFormat, 
  Answer,
  BLOCK_ORDER,
  Question
} from '../../types/Test';

interface QuestionFormProps {
  onQuestionCreated?: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ onQuestionCreated }) => {
  const initialAnswers: Answer[] = Array(5).fill(null).map(() => ({
    text: '',
    imageUrl: '',
    isCorrect: false
  }));

  const [formData, setFormData] = useState<Partial<Question>>({
    title: '',
    block: 'VERBAL',
    format: 'SOLO_TEXTO',
    answers: initialAnswers,
    mathQuestion: {
      question: '',
      answer: ''
    }
  });

  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [answerImages, setAnswerImages] = useState<(File | null)[]>([null, null, null, null, null]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAnswerChange = (index: number, field: keyof Answer, value: string | boolean) => {
    setFormData(prev => {
      const newAnswers = [...(prev.answers || [])];
      if (field === 'isCorrect' && value === true) {
        newAnswers.forEach(answer => answer.isCorrect = false);
      }
      newAnswers[index] = { ...newAnswers[index], [field]: value };
      return { ...prev, answers: newAnswers };
    });
  };

  const handleMathQuestionChange = (field: 'question' | 'answer', value: string) => {
    setFormData(prev => ({
      ...prev,
      mathQuestion: {
        ...(prev.mathQuestion || { question: '', answer: '' }),
        [field]: value
      }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (typeof index === 'undefined') {
      setQuestionImage(file);
    } else {
      const newAnswerImages = [...answerImages];
      newAnswerImages[index] = file;
      setAnswerImages(newAnswerImages);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title?.trim()) {
      toast.error('El título de la pregunta es obligatorio');
      return false;
    }

    if (formData.format !== 'SOLO_TEXTO' && !questionImage) {
      toast.error('Debe subir una imagen para la pregunta');
      return false;
    }

    if (formData.format === 'CINCO_IMAGENES' && answerImages.some(img => !img)) {
      toast.error('Debe subir una imagen para cada respuesta');
      return false;
    }

    if (!formData.answers?.some(answer => answer.isCorrect)) {
      toast.error('Debe seleccionar una respuesta correcta');
      return false;
    }

    if (formData.answers?.some(answer => !answer.text.trim())) {
      toast.error('Todas las respuestas deben tener texto');
      return false;
    }

    if (formData.block === 'MEMORIA') {
      if (!formData.mathQuestion?.question.trim() || !formData.mathQuestion?.answer.trim()) {
        toast.error('La pregunta y respuesta de matemáticas son obligatorias para el bloque de memoria');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      let questionImageUrl = '';
      if (questionImage) {
        const result = await uploadImage(questionImage);
        questionImageUrl = result.secure_url;
      }

      const updatedAnswers = [...(formData.answers || [])];
      if (formData.format === 'CINCO_IMAGENES') {
        for (let i = 0; i < answerImages.length; i++) {
          if (answerImages[i]) {
            const result = await uploadImage(answerImages[i]!);
            updatedAnswers[i] = { ...updatedAnswers[i], imageUrl: result.secure_url };
          }
        }
      }

      const questionData = {
        ...formData,
        imageUrl: questionImageUrl,
        answers: updatedAnswers,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'questions'), questionData);
      toast.success('Pregunta creada exitosamente');

      // Resetear el formulario
      setFormData({
        title: '',
        block: 'VERBAL',
        format: 'SOLO_TEXTO',
        answers: initialAnswers,
        mathQuestion: { question: '', answer: '' }
      });
      setQuestionImage(null);
      setAnswerImages([null, null, null, null, null]);

      if (onQuestionCreated) {
        onQuestionCreated();
      }
    } catch (error) {
      console.error('Error al crear la pregunta:', error);
      toast.error('Error al crear la pregunta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Crear Nueva Pregunta</h2>

        <div className="grid grid-cols-1 gap-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título de la Pregunta
            </label>
            <textarea
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
              placeholder="Escribe la pregunta aquí..."
            />
          </div>

          {/* Bloque y Formato */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bloque
              </label>
              <select
                name="block"
                value={formData.block}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
              >
                {BLOCK_ORDER.map(block => (
                  <option key={block} value={block}>{block}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato
              </label>
              <select
                name="format"
                value={formData.format}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
              >
                <option value="SOLO_TEXTO">Solo texto</option>
                <option value="UNA_IMAGEN">Una imagen</option>
                <option value="CINCO_IMAGENES">Cinco imágenes</option>
              </select>
            </div>
          </div>

          {/* Imagen de la pregunta */}
          {formData.format !== 'SOLO_TEXTO' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen de la Pregunta
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={e => handleImageUpload(e)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
              />
              {questionImage && (
                <img
                  src={URL.createObjectURL(questionImage)}
                  alt="Vista previa"
                  className="mt-2 max-h-40 rounded-lg"
                />
              )}
            </div>
          )}

          {/* Respuestas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Respuestas
            </label>
            <div className="space-y-4">
              {formData.answers?.map((answer, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={answer.text}
                      onChange={(e) => handleAnswerChange(index, 'text', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
                      placeholder={`Respuesta ${index + 1}`}
                    />
                    {formData.format === 'CINCO_IMAGENES' && (
                      <div className="mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, index)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
                        />
                        {answerImages[index] && (
                          <img
                            src={URL.createObjectURL(answerImages[index]!)}
                            alt={`Vista previa respuesta ${index + 1}`}
                            className="mt-2 max-h-20 rounded-lg"
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <label className="flex items-center space-x-2 whitespace-nowrap">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={answer.isCorrect}
                      onChange={() => handleAnswerChange(index, 'isCorrect', true)}
                      className="text-[#91c26a] focus:ring-[#91c26a]"
                    />
                    <span className="text-sm text-gray-600">Correcta</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Pregunta de matemáticas para bloque de memoria */}
          {formData.block === 'MEMORIA' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pregunta de Matemáticas
                </label>
                <input
                  type="text"
                  value={formData.mathQuestion?.question}
                  onChange={(e) => handleMathQuestionChange('question', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
                  placeholder="Ej: ¿Cuánto es 15 + 7?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Respuesta
                </label>
                <input
                  type="text"
                  value={formData.mathQuestion?.answer}
                  onChange={(e) => handleMathQuestionChange('answer', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
                  placeholder="Ej: 22"
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-semibold text-white ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#91c26a] hover:bg-[#7ea756]'
            }`}
          >
            {loading ? 'Creando...' : 'Crear Pregunta'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default QuestionForm;

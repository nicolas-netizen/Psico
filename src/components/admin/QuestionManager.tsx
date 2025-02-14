import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Loader } from 'lucide-react';
import { Question, TextQuestion, MemoryQuestion, DistractionQuestion, SequenceQuestion } from '../../services/firestore';

interface MemoryQuestionForm {
  type: 'memory';
  images: string[];
  correctImageIndex: number;
  distractionQuestion: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
  followUpQuestion: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
}

const QuestionManager: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<'text' | 'memory' | 'distraction' | 'sequence'>('text');
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<{ [key: number]: boolean }>({});
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'text',
    block: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [correctImageIndex, setCorrectImageIndex] = useState<number>(0);
  const [distractionQuestion, setDistractionQuestion] = useState('');
  const [distractionOptions, setDistractionOptions] = useState<string[]>(['']);
  const [distractionCorrectAnswer, setDistractionCorrectAnswer] = useState<number>(0);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpOptions, setFollowUpOptions] = useState<string[]>(['']);
  const [followUpCorrectAnswer, setFollowUpCorrectAnswer] = useState<number>(0);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'questions'));
      const loadedQuestions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Question[];
      setQuestions(loadedQuestions);
      
      // Extraer bloques únicos
      const uniqueBlocks = Array.from(new Set(loadedQuestions.map(q => q.block)));
      setBlocks(uniqueBlocks);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Error al cargar las preguntas');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayInputChange = (index: number, value: string, field: 'options' | 'images' | 'sequence') => {
    setCurrentQuestion(prev => {
      const newArray = [...(prev[field] || [])];
      newArray[index] = value;
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImages(prev => ({ ...prev, [index]: true }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'psico_upload');

    try {
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/db6xthbpp/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      if (data.secure_url) {
        handleArrayInputChange(index, data.secure_url, 'images');
        toast.success('Imagen subida exitosamente');
      } else {
        throw new Error('No se recibió la URL de la imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Error al subir la imagen');
    } finally {
      setUploadingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const questionData = {
        ...currentQuestion,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      if (isEditing && currentQuestion.id) {
        await updateDoc(doc(db, 'questions', currentQuestion.id), questionData);
        toast.success('Pregunta actualizada exitosamente');
      } else {
        await addDoc(collection(db, 'questions'), questionData);
        toast.success('Pregunta creada exitosamente');
      }

      setIsEditing(false);
      setCurrentQuestion({ type: 'text', block: '' });
      loadQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Error al guardar la pregunta');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
      try {
        await deleteDoc(doc(db, 'questions', id));
        toast.success('Pregunta eliminada exitosamente');
        loadQuestions();
      } catch (error) {
        console.error('Error deleting question:', error);
        toast.error('Error al eliminar la pregunta');
      }
    }
  };

  const handleMemoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Solo permitir seleccionar 4 imágenes
    if (files.length !== 4) {
      toast.error('Por favor, selecciona exactamente 4 imágenes');
      return;
    }

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('upload_preset', 'psico_upload');

        const response = await fetch(
          'https://api.cloudinary.com/v1_1/db6xthbpp/image/upload',
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json();
        uploadedUrls.push(data.secure_url);
      }

      setImages(uploadedUrls);
      toast.success('Imágenes subidas correctamente');
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Error al subir las imágenes');
    }
  };

  const handleDistractionOptionChange = (index: number, value: string) => {
    const newOptions = [...distractionOptions];
    newOptions[index] = value;
    setDistractionOptions(newOptions);
  };

  const handleFollowUpOptionChange = (index: number, value: string) => {
    const newOptions = [...followUpOptions];
    newOptions[index] = value;
    setFollowUpOptions(newOptions);
  };

  const addDistractionOption = () => {
    setDistractionOptions([...distractionOptions, '']);
  };

  const addFollowUpOption = () => {
    setFollowUpOptions([...followUpOptions, '']);
  };

  const renderQuestionForm = () => {
    switch (selectedType) {
      case 'memory':
        return (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleMemoryImageUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#91c26a] file:text-white hover:file:bg-[#82b35b]"
              />
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Imagen ${index + 1}`}
                        className={`w-full h-48 object-cover rounded-lg cursor-pointer ${
                          correctImageIndex === index ? 'ring-4 ring-[#91c26a]' : ''
                        }`}
                        onClick={() => setCorrectImageIndex(index)}
                      />
                      <div className="absolute top-2 left-2 bg-white rounded-full px-2 py-1 text-sm font-medium">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pregunta de Distracción
                </label>
                <input
                  type="text"
                  value={distractionQuestion}
                  onChange={(e) => setDistractionQuestion(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                  placeholder="Ej: ¿Cuánto es 2 + 2?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opciones de Distracción
                </label>
                {distractionOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleDistractionOptionChange(index, e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                      placeholder={`Opción ${index + 1}`}
                    />
                    <input
                      type="radio"
                      name="distractionCorrect"
                      checked={distractionCorrectAnswer === index}
                      onChange={() => setDistractionCorrectAnswer(index)}
                      className="h-4 w-4 text-[#91c26a] focus:ring-[#91c26a]"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDistractionOption}
                  className="mt-2 text-sm text-[#91c26a] hover:text-[#82b35b]"
                >
                  + Agregar opción
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pregunta de Seguimiento
                </label>
                <input
                  type="text"
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                  placeholder="Ej: ¿Cuál era la imagen correcta?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opciones de Seguimiento
                </label>
                {followUpOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleFollowUpOptionChange(index, e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                      placeholder={`Opción ${index + 1}`}
                    />
                    <input
                      type="radio"
                      name="followUpCorrect"
                      checked={followUpCorrectAnswer === index}
                      onChange={() => setFollowUpCorrectAnswer(index)}
                      className="h-4 w-4 text-[#91c26a] focus:ring-[#91c26a]"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFollowUpOption}
                  className="mt-2 text-sm text-[#91c26a] hover:text-[#82b35b]"
                >
                  + Agregar opción
                </button>
              </div>
            </div>
          </>
        );
      case 'distraction':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Contenido inicial</label>
              <textarea
                name="initialContent"
                value={(currentQuestion as DistractionQuestion)?.initialContent || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Tiempo de distracción (segundos)</label>
              <input
                type="number"
                name="distractionTime"
                value={(currentQuestion as DistractionQuestion)?.distractionTime || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Contenido de distracción</label>
              <textarea
                name="distractionContent"
                value={(currentQuestion as DistractionQuestion)?.distractionContent || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
              />
            </div>
          </>
        );
      // Agrega más casos según sea necesario
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Preguntas</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Pregunta</label>
              <select
                name="type"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as any);
                  setCurrentQuestion(prev => ({ ...prev, type: e.target.value as any }));
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
              >
                <option value="text">Texto</option>
                <option value="memory">Memoria</option>
                <option value="distraction">Distracción</option>
                <option value="sequence">Secuencia</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Bloque</label>
              <input
                type="text"
                name="block"
                value={currentQuestion.block}
                onChange={handleInputChange}
                list="blocks"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
              />
              <datalist id="blocks">
                {blocks.map((block) => (
                  <option key={block} value={block} />
                ))}
              </datalist>
            </div>
          </div>

          {renderQuestionForm()}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Pregunta</label>
            <textarea
              name="question"
              value={currentQuestion.question || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Opciones</label>
            <div className="space-y-2">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  type="text"
                  value={currentQuestion.options?.[index] || ''}
                  onChange={(e) => handleArrayInputChange(index, e.target.value, 'options')}
                  placeholder={`Opción ${index + 1}`}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
                />
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Respuesta Correcta</label>
            <input
              type="text"
              name="correctAnswer"
              value={currentQuestion.correctAnswer || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a]"
            />
          </div>

          <div className="flex justify-end space-x-2">
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setCurrentQuestion({ type: 'text', block: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-[#91c26a] text-white rounded-md hover:bg-[#82b35b]"
            >
              {isEditing ? 'Actualizar' : 'Crear'} Pregunta
            </button>
          </div>
        </form>

        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Preguntas Existentes</h3>
          <div className="space-y-4">
            {questions.map((question) => (
              <div
                key={question.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full mb-2">
                      {question.type} - {question.block}
                    </span>
                    <p className="text-gray-900">{question.question}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setCurrentQuestion(question);
                        setSelectedType(question.type);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-500"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => question.id && handleDelete(question.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionManager;

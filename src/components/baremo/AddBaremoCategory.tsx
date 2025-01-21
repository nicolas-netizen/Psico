import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { baremoService } from '../../services/baremoService';
import { BaremoCategory } from '../../types/baremo';

interface AddBaremoCategoryProps {
  onCategoryAdded: () => void;
}

const AddBaremoCategory: React.FC<AddBaremoCategoryProps> = ({ onCategoryAdded }) => {
  const [name, setName] = useState('');
  const [maxPoints, setMaxPoints] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCategory = async () => {
    if (!name || !maxPoints) {
      toast.error('Por favor, completa todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    try {
      const newCategory: BaremoCategory = {
        id: Date.now().toString(), // Generamos un ID único
        name,
        maxPoints: parseInt(maxPoints, 10),
        description
      };

      await baremoService.addCategory(newCategory);
      toast.success('Categoría agregada correctamente');
      onCategoryAdded();
      
      // Limpiar el formulario
      setName('');
      setMaxPoints('');
      setDescription('');
    } catch (error) {
      console.error('Error al agregar la categoría:', error);
      toast.error('Hubo un error al agregar la categoría');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Agregar Nueva Categoría</h2>
      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-2">
            Nombre de la Categoría <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
            placeholder="Ej. Experiencia Laboral"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label className="block font-medium mb-2">
            Puntos Máximos <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={maxPoints}
            onChange={(e) => setMaxPoints(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
            placeholder="Ej. 10"
            min="0"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label className="block font-medium mb-2">
            Descripción <span className="text-gray-500">(opcional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-[#91c26a] focus:border-transparent"
            placeholder="Ej. Esta categoría evalúa la experiencia profesional del candidato"
            rows={3}
            disabled={isSubmitting}
          />
        </div>
        
        <button
          onClick={handleAddCategory}
          disabled={isSubmitting}
          className={`w-full px-4 py-2 text-white rounded transition-colors ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-[#91c26a] hover:bg-[#7ea756]'
          }`}
        >
          {isSubmitting ? 'Agregando...' : 'Agregar Categoría'}
        </button>
      </div>
    </div>
  );
};

export default AddBaremoCategory;

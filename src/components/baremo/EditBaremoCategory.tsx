import React, { useState } from 'react';
import { BaremoCategory } from '../../types/baremo';

interface EditBaremoCategoryProps {
  category: BaremoCategory;
  onSave: (category: BaremoCategory) => void;
  onCancel: () => void;
}

const EditBaremoCategory: React.FC<EditBaremoCategoryProps> = ({ category, onSave, onCancel }) => {
  const [editedCategory, setEditedCategory] = useState<BaremoCategory>(category);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedCategory(prev => ({
      ...prev,
      [name]: name === 'description' ? value : 
              name === 'name' ? value :
              Number(value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedCategory);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nombre
        </label>
        <input
          type="text"
          name="name"
          value={editedCategory.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          name="description"
          value={editedCategory.description}
          onChange={handleChange}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Puntaje Máximo
          </label>
          <input
            type="number"
            name="maxScore"
            value={editedCategory.maxScore}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
            required
            min="0"
          />
          <p className="mt-1 text-sm text-gray-500">
            Máximo puntaje que se puede obtener
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Puntos Asignados
          </label>
          <input
            type="number"
            name="maxPoints"
            value={editedCategory.maxPoints}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
            required
            min="0"
          />
          <p className="mt-1 text-sm text-gray-500">
            Puntos que vale esta categoría
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#91c26a]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#91c26a] hover:bg-[#7ea756] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#91c26a]"
        >
          Guardar
        </button>
      </div>
    </form>
  );
};

export default EditBaremoCategory;

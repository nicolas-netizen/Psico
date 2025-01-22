import React, { useState, useEffect } from 'react';
import { BaremoRule } from '../../types/baremo';

interface EditBaremoRuleProps {
  rule: BaremoRule;
  onSave: (rule: BaremoRule) => void;
  onCancel: () => void;
}

const EditBaremoRule: React.FC<EditBaremoRuleProps> = ({ rule, onSave, onCancel }) => {
  const [editedRule, setEditedRule] = useState<BaremoRule>(rule);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedRule(prev => ({
      ...prev,
      [name]: name === 'description' ? value : Number(value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedRule);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Puntaje Mínimo
          </label>
          <input
            type="number"
            name="minScore"
            value={editedRule.minScore}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Puntaje Máximo
          </label>
          <input
            type="number"
            name="maxScore"
            value={editedRule.maxScore}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Puntos
          </label>
          <input
            type="number"
            name="points"
            value={editedRule.points}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          name="description"
          value={editedRule.description}
          onChange={handleChange}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
        />
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

export default EditBaremoRule;

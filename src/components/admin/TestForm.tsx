import React from 'react';
import { Test, BlockConfig, QuestionBlock, TestType } from '../../types/Test';

interface TestFormProps {
  test: Partial<Test>;
  onSubmit: (test: Partial<Test>) => void;
  onChange: (test: Partial<Test>) => void;
}

const TestForm: React.FC<TestFormProps> = ({ test, onSubmit, onChange }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(test);
  };

  const handleBlockConfigChange = (index: number, field: keyof BlockConfig, value: any) => {
    const newBlockConfigs = [...(test.blockConfigs || [])];
    newBlockConfigs[index] = {
      ...newBlockConfigs[index],
      [field]: value
    };
    onChange({ ...test, blockConfigs: newBlockConfigs });
  };

  const handleAddBlock = () => {
    const newBlockConfigs = [...(test.blockConfigs || [])];
    newBlockConfigs.push({
      block: 'VERBAL',
      questionCount: 15,
      timeLimit: 15
    });
    onChange({ ...test, blockConfigs: newBlockConfigs });
  };

  const handleRemoveBlock = (index: number) => {
    const newBlockConfigs = [...(test.blockConfigs || [])];
    newBlockConfigs.splice(index, 1);
    onChange({ ...test, blockConfigs: newBlockConfigs });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Título</label>
        <input
          type="text"
          value={test.title || ''}
          onChange={(e) => onChange({ ...test, title: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          value={test.description || ''}
          onChange={(e) => onChange({ ...test, description: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tipo</label>
        <select
          value={test.type || 'SIMULACRO'}
          onChange={(e) => onChange({ ...test, type: e.target.value as TestType })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
        >
          <option value="SIMULACRO">Simulacro</option>
          <option value="PRACTICA">Práctica</option>
          <option value="EVALUACION">Evaluación</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Estado</label>
        <select
          value={test.status || 'active'}
          onChange={(e) => onChange({ ...test, status: e.target.value as 'active' | 'inactive' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
        >
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700">Bloques</label>
          <button
            type="button"
            onClick={handleAddBlock}
            className="px-3 py-1 text-sm bg-[#91c26a] text-white rounded-md hover:bg-[#7ea756]"
          >
            Agregar Bloque
          </button>
        </div>
        
        <div className="space-y-4">
          {test.blockConfigs?.map((config, index) => (
            <div key={index} className="flex gap-4 items-start p-4 border rounded-lg">
              <div className="flex-1">
                <select
                  value={config.block}
                  onChange={(e) => handleBlockConfigChange(index, 'block', e.target.value as QuestionBlock)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                >
                  <option value="VERBAL">Verbal</option>
                  <option value="NUMERICO">Numérico</option>
                  <option value="ESPACIAL">Espacial</option>
                  <option value="MECANICO">Mecánico</option>
                  <option value="PERCEPTIVO">Perceptivo</option>
                  <option value="MEMORIA">Memoria</option>
                  <option value="ABSTRACTO">Abstracto</option>
                </select>
              </div>
              
              <div className="flex-1">
                <input
                  type="number"
                  value={config.questionCount}
                  onChange={(e) => handleBlockConfigChange(index, 'questionCount', parseInt(e.target.value))}
                  placeholder="Número de preguntas"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                  min="1"
                />
              </div>
              
              <div className="flex-1">
                <input
                  type="number"
                  value={config.timeLimit}
                  onChange={(e) => handleBlockConfigChange(index, 'timeLimit', parseInt(e.target.value))}
                  placeholder="Tiempo (min)"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#91c26a] focus:ring-[#91c26a] sm:text-sm"
                  min="1"
                />
              </div>

              <button
                type="button"
                onClick={() => handleRemoveBlock(index)}
                className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-[#91c26a] text-white px-4 py-2 rounded-md hover:bg-[#7ea756]"
        >
          Guardar Test
        </button>
      </div>
    </form>
  );
};

export default TestForm;
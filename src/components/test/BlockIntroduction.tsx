import React from 'react';
import { motion } from 'framer-motion';
import { Block } from '../../types/blocks';

interface BlockIntroductionProps {
  block: Block;
  onStart: () => void;
  blockNumber: number;
  totalBlocks: number;
}

const BlockIntroduction: React.FC<BlockIntroductionProps> = ({
  block,
  onStart,
  blockNumber,
  totalBlocks
}) => {
  const getBlockDescription = (type: string) => {
    switch (type) {
      case 'Memoria':
        return 'En este bloque se te mostrarán una serie de imágenes que deberás memorizar. Presta atención a los detalles.';
      case 'Texto':
        return 'En este bloque responderás preguntas basadas en texto. Lee cuidadosamente cada pregunta.';
      case 'Distracción':
        return 'Este es un bloque de distracción. Mantén la calma y concéntrate en cada ejercicio.';
      case 'Secuencia':
        return 'En este bloque trabajarás con secuencias. Identifica los patrones y relaciones.';
      default:
        return 'Lee cuidadosamente las instrucciones y responde cada pregunta.';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm"
    >
      <div className="text-center mb-8">
        <div className="text-sm font-medium text-[#91c26a] mb-2">
          Bloque {blockNumber} de {totalBlocks}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {block.name || `Bloque de ${block.type}`}
        </h2>
        <div className="h-2 w-full bg-gray-200 rounded-full">
          <div
            className="h-2 bg-[#91c26a] rounded-full"
            style={{ width: `${(blockNumber / totalBlocks) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Descripción del Bloque
        </h3>
        <p className="text-gray-600 mb-4">
          {block.description || getBlockDescription(block.type)}
        </p>
        {block.timeLimit && (
          <div className="text-sm text-gray-500">
            <span className="font-medium">Tiempo límite:</span>{' '}
            {block.timeLimit} minutos
          </div>
        )}
      </div>

      <div className="bg-[#f1f7ed] rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-[#91c26a] mb-3">
          Instrucciones
        </h3>
        <ul className="space-y-2 text-gray-700">
          <li>• Lee cuidadosamente cada pregunta antes de responder</li>
          <li>• Administra bien tu tiempo</li>
          <li>• Si no estás seguro de una respuesta, puedes volver a ella después</li>
          {block.type === 'Memoria' && (
            <li>• Presta atención a todos los detalles de las imágenes</li>
          )}
        </ul>
      </div>

      <div className="text-center">
        <button
          onClick={onStart}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#91c26a] hover:bg-[#82b35b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#91c26a] transition-colors duration-200"
        >
          Comenzar Bloque
        </button>
      </div>
    </motion.div>
  );
};

export default BlockIntroduction;

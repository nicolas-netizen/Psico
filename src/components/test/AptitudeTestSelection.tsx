import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Calculator, Box, Wrench, Eye, BookOpen, Lightbulb } from 'lucide-react';
import { BlockType, BLOCK_TYPES, BLOCK_NAMES, DEFAULT_BLOCK_TIMES } from '../../types/blocks';

interface BlockSelection {
  type: BlockType;
  selected: boolean;
  count: number;
}

const blockIcons = {
  AptitudVerbal: BookOpen,
  AptitudNumerica: Calculator,
  AptitudEspacial: Box,
  AptitudMecanica: Wrench,
  AptitudPerceptiva: Eye,
  Memoria: Brain,
  RazonamientoAbstracto: Lightbulb
};

const AptitudeTestSelection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBlocks, setSelectedBlocks] = useState<BlockSelection[]>(
    BLOCK_TYPES.map(type => ({
      type,
      selected: false,
      count: 0
    }))
  );

  const handleBlockToggle = (index: number) => {
    setSelectedBlocks(prev => prev.map((block, i) => 
      i === index ? { ...block, selected: !block.selected } : block
    ));
  };

  const handleCountChange = (index: number, increment: boolean) => {
    setSelectedBlocks(prev => prev.map((block, i) => {
      if (i !== index) return block;
      const newCount = increment ? block.count + 1 : Math.max(0, block.count - 1);
      return {
        ...block,
        count: newCount,
        selected: newCount > 0
      };
    }));
  };

  const handleStartTest = () => {
    const selectedTypes = selectedBlocks
      .filter(block => block.selected && block.count > 0)
      .map(block => ({
        type: block.type,
        count: block.count,
        timeLimit: DEFAULT_BLOCK_TIMES[block.type]
      }));

    if (selectedTypes.length === 0) {
      alert('Por favor selecciona al menos un bloque de preguntas');
      return;
    }

    navigate('/test', { state: { blocks: selectedTypes } });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Selecciona los bloques de preguntas
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedBlocks.map((block, index) => {
          const Icon = blockIcons[block.type];
          return (
            <div
              key={block.type}
              className={`
                p-6 rounded-lg border-2 transition-all
                ${block.selected 
                  ? 'border-[#91c26a] bg-[#f0f7eb]' 
                  : 'border-gray-200 hover:border-[#91c26a] hover:bg-[#f8faf5]'}
              `}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`
                    p-2 rounded-lg
                    ${block.selected ? 'bg-[#91c26a] text-white' : 'bg-gray-100 text-gray-600'}
                  `}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-medium text-gray-900">
                    {BLOCK_NAMES[block.type]}
                  </h3>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleCountChange(index, false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                    disabled={block.count === 0}
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{block.count}</span>
                  <button
                    onClick={() => handleCountChange(index, true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  {DEFAULT_BLOCK_TIMES[block.type]} min
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleStartTest}
          className="px-6 py-3 bg-[#91c26a] text-white rounded-lg font-medium hover:bg-[#7ea756] transition-colors"
        >
          Comenzar Test
        </button>
      </div>
    </div>
  );
};

export default AptitudeTestSelection;

export type BlockType = 
  | 'AptitudVerbal'
  | 'AptitudNumerica'
  | 'AptitudEspacial'
  | 'AptitudMecanica'
  | 'AptitudPerceptiva'
  | 'Memoria'
  | 'RazonamientoAbstracto';

export interface Block {
  id: string;
  name: string;
  type: BlockType;
  description?: string;
  isActive: boolean;
  timeLimit?: number;
}

// Orden específico de los bloques
export const BLOCK_TYPES: BlockType[] = [
  'AptitudVerbal',
  'AptitudNumerica',
  'AptitudEspacial',
  'AptitudMecanica',
  'AptitudPerceptiva',
  'Memoria',
  'RazonamientoAbstracto'
];

export const BLOCK_NAMES: Record<BlockType, string> = {
  AptitudVerbal: 'Aptitud verbal',
  AptitudNumerica: 'Aptitud numérica',
  AptitudEspacial: 'Aptitud espacial',
  AptitudMecanica: 'Aptitud mecánica',
  AptitudPerceptiva: 'Aptitud perceptiva',
  Memoria: 'Memoria',
  RazonamientoAbstracto: 'Razonamiento abstracto'
};

// Tiempo predeterminado por bloque en minutos
export const DEFAULT_BLOCK_TIMES: Record<BlockType, number> = {
  AptitudVerbal: 15,
  AptitudNumerica: 20,
  AptitudEspacial: 15,
  AptitudMecanica: 15,
  AptitudPerceptiva: 15,
  Memoria: 10,
  RazonamientoAbstracto: 15
};

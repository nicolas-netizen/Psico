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
}

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

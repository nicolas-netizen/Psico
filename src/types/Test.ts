export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  OPEN_ANSWER = 'open_answer',
  MATCHING = 'matching',
  INTERACTIVE = 'interactive'
}

export enum AptitudeCategory {
  // Verbal
  SYNONYMS = 'Sinónimos',
  ANTONYMS = 'Antónimos', 
  VERBAL_ANALOGIES = 'Analogías Verbales',
  SPELLING = 'Ortografía',
  PROVERBS = 'Refranes',

  // Numérico
  BASIC_OPERATIONS = 'Operaciones Elementales',
  REASONING_PROBLEMS = 'Problemas de Razonamiento',
  AREA_PERIMETER_CALCULATION = 'Cálculo de Áreas y Perímetros',
  DECIMAL_FRACTION_OPERATIONS = 'Operaciones con Decimales y Fracciones',
  PROPORTIONS = 'Regla de Tres',
  PERCENTAGES = 'Porcentajes',

  // Espacial
  FIGURE_FOLDING = 'Plegado de Figuras',
  PERSPECTIVE_VISUALIZATION = 'Visualización de Perspectivas',
  FIGURE_ROTATION = 'Rotación de Figuras',
  BLOCK_COUNTING = 'Conteo de Bloques',

  // Mecánico
  PHYSICAL_MECHANICAL_TESTS = 'Tests Físico-Mecánicos',
  MECHANISMS = 'Mecanismos',
  BALANCE_SYSTEMS = 'Sistemas de Balanza',
  PULLEYS = 'Poleas',
  GEARS = 'Engranajes',

  // Perceptivo
  FILE_ORGANIZATION = 'Organización de Archivos',
  ALPHABETICAL_ORDERING = 'Ordenación Alfabética',
  FATIGUE_RESISTANCE = 'Resistencia a la Fatiga',
  ERROR_DETECTION = 'Detección de Errores',

  // Memoria
  VISUAL_MEMORY = 'Memoria Visual',
  READING_MEMORY = 'Memoria Lectora',

  // Razonamiento Abstracto
  ALPHANUMERIC_SERIES = 'Series Alfanuméricas',
  FIGURE_SERIES = 'Series de Figuras',
  DOMINO_REASONING = 'Razonamiento con Dominós',
  CARD_REASONING = 'Razonamiento con Cartas',
  COIN_REASONING = 'Razonamiento con Monedas'
}

export enum AptitudeDifficulty {
  EASY = 'Fácil',
  MEDIUM = 'Medio',
  HARD = 'Difícil'
}

export enum QuestionCategory {
  MATHEMATICAL = 'mathematical',
  LANGUAGE = 'language',
  LOGICAL_REASONING = 'logical_reasoning',
  MEMORY = 'memory',
  PERSONALITY = 'personality',
  SPATIAL_INTELLIGENCE = 'spatial_intelligence'
}

export enum QuestionDifficulty {
  EASY = 'basic',
  MEDIUM = 'intermediate',
  HARD = 'advanced'
}

export enum Aptitude {
  SPATIAL_INTELLIGENCE = 'Inteligencia Espacial',
  MATHEMATICAL_LOGIC = 'Lógica Matemática',
  LINGUISTIC_INTELLIGENCE = 'Inteligencia Lingüística',
  MUSICAL_INTELLIGENCE = 'Inteligencia Musical',
  BODILY_KINESTHETIC = 'Inteligencia Corporal-Kinestésica',
  INTERPERSONAL_INTELLIGENCE = 'Inteligencia Interpersonal',
  INTRAPERSONAL_INTELLIGENCE = 'Inteligencia Intrapersonal',
  NATURALISTIC_INTELLIGENCE = 'Inteligencia Naturalista',
  EMOTIONAL_INTELLIGENCE = 'Inteligencia Emocional'
}

import { Timestamp } from 'firebase/firestore';

export enum QuestionBlock {
  VERBAL = 'VERBAL',
  NUMERICO = 'NUMERICO',
  ESPACIAL = 'ESPACIAL',
  MECANICO = 'MECANICO',
  PERCEPTIVO = 'PERCEPTIVO',
  MEMORIA = 'MEMORIA',
  ABSTRACTO = 'ABSTRACTO'
}

export enum TestDifficulty {
  FACIL = 'Fácil',
  INTERMEDIO = 'Intermedio',
  DIFICIL = 'Difícil'
}

export const BLOCK_ORDER = [
  QuestionBlock.VERBAL,
  QuestionBlock.NUMERICO,
  QuestionBlock.ESPACIAL,
  QuestionBlock.MECANICO,
  QuestionBlock.PERCEPTIVO,
  QuestionBlock.MEMORIA,
  QuestionBlock.ABSTRACTO
];

export type QuestionFormat = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'OPEN_ANSWER';

export interface Answer {
  text: string;
  imageUrl?: string;
  isCorrect: boolean;
}

export interface MathQuestion {
  question: string;
  answer: string;
}

export interface Question {
  id?: string;
  title: string;
  block: QuestionBlock;
  format: QuestionFormat;
  imageUrl?: string;
  answers: Answer[];
  mathQuestion?: MathQuestion;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface BlockConfig {
  block: QuestionBlock;
  questionCount: number;
  timeLimit: number;
}

export type TestType = 'SIMULACRO' | 'PRACTICA' | 'EVALUACION';

export interface Test {
  id?: string;
  title: string;
  description: string;
  type: TestType;
  difficulty: TestDifficulty;
  blockConfigs: BlockConfig[];
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TestResult {
  id?: string;
  testId: string;
  userId: string;
  answers: {
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
  }[];
  blockScores: {
    block: QuestionBlock;
    correct: number;
    total: number;
  }[];
  totalScore: number;
  startedAt: Date;
  finishedAt: Date;
}

export const DEFAULT_SIMULACRO_CONFIG: BlockConfig[] = BLOCK_ORDER.map(block => ({
  block,
  questionCount: 15,
  timeLimit: block === QuestionBlock.MEMORIA ? 20 : 15
}));

export interface AptitudeQuestionCategory {
  id: string;
  name: AptitudeCategory;
  description: string;
  difficulty: AptitudeDifficulty;
}

export interface AptitudeQuestion extends Question {
  category: AptitudeCategory;
  difficulty: AptitudeDifficulty;
}

export interface UserAnswer {
  questionId: string;
  selectedOption: number;
  category?: string;
  difficulty?: string;
  isCorrect?: boolean;
  timeTaken?: number; 
}

export interface DetailedTestResult {
  testId: string;
  userId: string;
  score: number;
  percentageScore: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: Date;
  timeTaken: number; 
  categoryPerformance: {
    [key in QuestionCategory]?: {
      correctAnswers: number;
      totalQuestions: number;
      score: number;
      percentageScore: number;
    }
  };
  incorrectQuestions: string[];
  strengths: QuestionCategory[];
  weaknesses: QuestionCategory[];
}

export interface TestOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface TestQuestion {
  id: string;
  text: string;
  options: (string | { text: string; id?: string })[];
  correctAnswer: number;
  category?: string;
  difficulty?: string;
}

export const calculateGrade = (correctCount: number, totalCount: number): number => {
  const pointsPerQuestion = 0.067;
  return Math.min(correctCount * pointsPerQuestion, 7);
};

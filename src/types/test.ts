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

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface TestBlock {
  id: string;
  title: string;
  description?: string;
  timeLimit: number; // Tiempo en minutos
  questions: Question[];
  type: 'verbal' | 'numerical' | 'abstract';
}

export interface Test {
  id: string;
  title: string;
  description: string;
  blocks: TestBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface TestResult {
  id: string;
  testId: string;
  userId: string;
  score: number;
  completedAt: any;
  testTitle: string;
  timeSpent?: number;
  answers?: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
  }>;
}

export interface BlockResult {
  blockId: string;
  timeSpent: number; // Tiempo usado en segundos
  answers: { [questionId: string]: number };
  score: number;
}

export interface TestOption {
  id: string;
  text: string;
}

export interface TestQuestion {
  id: string;
  text: string;
  options: (string | { text: string; id?: string })[];
  correctAnswer: number;
  category?: string;
  difficulty?: string;
}

export interface AptitudeQuestion extends TestQuestion {
  category: AptitudeCategory;
  difficulty: AptitudeDifficulty;
}

export interface AptitudeQuestionCategory {
  id: string;
  name: AptitudeCategory;
  description: string;
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

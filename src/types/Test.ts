export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  OPEN_ANSWER = 'open_answer',
  MATCHING = 'matching'
}

export interface TestOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface TestQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: TestOption[];
  correctAnswer?: string | string[];
}

export interface Test {
  id: string;
  name: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: TestQuestion[];
  timeLimit?: number; // En minutos
}

export interface TestResult {
  testId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: Date;
}

export interface UserAnswer {
  questionId: string;
  selectedOption?: string;
  openAnswer?: string;
}

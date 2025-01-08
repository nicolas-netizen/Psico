export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  OPEN_ANSWER = 'open_answer',
  MATCHING = 'matching',
  INTERACTIVE = 'interactive'
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
  interactiveOptions?: {
    options: string[];
    correctAnswer: number;
  }
}

export interface Test {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  plans: string[]; // Array of plan IDs this test is associated with
  category?: string;
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  createdAt: string;
  updatedAt: string;
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

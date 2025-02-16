import { Timestamp } from 'firebase/firestore';

export type BlockType = 
  | 'verbal'
  | 'numerical'
  | 'spatial'
  | 'mechanical'
  | 'perceptual'
  | 'abstract'
  | 'math';

export type QuestionFormat = 'text' | 'single_image' | 'multiple_images' | 'image_options';

export interface Question {
  id?: string;
  blockType: BlockType;
  format: QuestionFormat;
  text: string;
  options: string[];
  correctAnswer: number;
  image?: string;
  additionalImages?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface TestSession {
  id?: string;
  userId: string;
  testId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  blockResults: {
    [key in BlockType]?: {
      answers: number[];
      score: number;
      timeSpent: number;
    };
  };
  currentBlock?: BlockType;
  isCompleted: boolean;
}

export interface TestResult {
  id?: string;
  userId: string;
  testId: string;
  date: Timestamp;
  blockResults: TestSession['blockResults'];
  totalScore: number;
  baremo: Record<BlockType, {
    percentile: number;
    category: string;
  }>;
}

export interface Test {
  id?: string;
  title: string;
  description?: string;
  blocks: BlockType[];
  questionsPerBlock: number;
  timePerBlock: number;
  isSimulacro: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface BaremoCategory {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  maxPoints: number;
}

export interface BaremoRule {
  id: string;
  category: string;
  minScore: number;
  maxScore: number;
  points: number;
}

export interface BaremoConfig {
  categories: BaremoCategory[];
  rules: BaremoRule[];
}

export interface BaremoResult {
  score: number;
  points: number;
  category: string;
  timestamp: Date;
}

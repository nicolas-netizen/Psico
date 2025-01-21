export interface BaremoRule {
  id: string;
  category: string;
  minScore: number;
  maxScore: number;
  points: number;
  description: string;
}

export interface BaremoCategory {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
}

export interface BaremoConfig {
  categories: BaremoCategory[];
  rules: BaremoRule[];
}

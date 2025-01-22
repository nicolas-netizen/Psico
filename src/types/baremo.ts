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
  maxScore: number;    // Puntaje máximo posible para esta categoría
  maxPoints: number;   // Puntos máximos asignados por el admin
}

export interface BaremoConfig {
  categories: BaremoCategory[];
  rules: BaremoRule[];
}

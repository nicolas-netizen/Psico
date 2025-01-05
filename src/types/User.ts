export interface User {
  email: string;
  password: string;
  role: 'user' | 'admin';
  plan: 'basic' | 'premium' | 'annual';
  createdAt: string;
}

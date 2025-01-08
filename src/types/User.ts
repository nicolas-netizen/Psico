export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  subscription?: {
    planId: string;
    startDate: string;
    endDate: string;
  };
  testHistory?: string[];
}

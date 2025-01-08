export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  description?: string;
  recommended?: boolean;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

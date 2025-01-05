export interface Plan {
  id: string;
  name: string;
  price: string;
  features: string[];
  recommended?: boolean;
  featured?: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import type { Plan } from '../types/Plan';
import type { User } from '../types/User';
import type { Test } from '../types/Test';
import type { UserAnswer } from '../types/Test';
import type { TestResult } from '../types/Test';

// Function to read the current server port
function getCurrentServerPort(): string {
  try {
    // Try multiple potential paths
    const possiblePaths = [
      path.join(process.cwd(), 'server', 'current_port.txt'),
      path.join(process.cwd(), 'current_port.txt')
    ];

    for (const portFilePath of possiblePaths) {
      if (fs.existsSync(portFilePath)) {
        const port = fs.readFileSync(portFilePath, 'utf8').trim();
        return port;
      }
    }

    // Fallback to default if no port file found
    console.warn('No port file found, using default port');
    return '3001';
  } catch (error) {
    console.warn('Error reading server port:', error);
    return '3001';
  }
}

// Determine base URL dynamically
const BASE_URL = import.meta.env.VITE_API_URL || 
                 `http://localhost:${getCurrentServerPort()}`;

// Create axios instance with comprehensive configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for logging and debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Centralized error handling
function handleApiError(error: any) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with an error status
      console.error('Server Error:', error.response.data);
      throw new Error(error.response.data.message || 'Error en la solicitud');
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', error.request);
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión de red.');
    } else {
      // Error in setting up the request
      console.error('Request Setup Error:', error.message);
      throw new Error('Error al procesar la solicitud. Intenta nuevamente.');
    }
  } else {
    // Generic error handling
    console.error('Unexpected Error:', error);
    throw new Error('Error inesperado. Por favor, contacta soporte.');
  }
}

// Server connection check
async function pingServer() {
  try {
    const response = await apiClient.get('/ping');
    console.log('Server connection:', response.data.message);
    return true;
  } catch (error) {
    console.error('Server connection failed:', error);
    return false;
  }
}

// API methods
export const api = {
  pingServer,

  // Fetch plans with deduplication
  getPlans: async (): Promise<Plan[]> => {
    try {
      console.log('Fetching plans from:', BASE_URL);
      
      const response = await apiClient.get('/planes');
      
      // Deduplicate plans based on ID
      const uniquePlans = response.data.filter(
        (plan: Plan, index: number, self: Plan[]) => 
          self.findIndex(p => p.id === plan.id) === index
      );

      console.log('Plans received:', uniquePlans);
      return uniquePlans;
    } catch (error) {
      console.error('Error fetching plans:', error);
      handleApiError(error);
      throw error;
    }
  },

  // Create plan with unique ID generation
  createPlan: async (planData: Partial<Plan>): Promise<{plan: Plan}> => {
    try {
      console.log('Creating plan:', planData);
      
      // Ensure unique ID if not provided
      if (!planData.id) {
        planData.id = `plan-${Date.now()}`;
      }

      // Remove any existing plans with the same ID
      const existingPlans = await api.getPlans();
      const filteredPlans = existingPlans.filter(p => p.id !== planData.id);

      const response = await apiClient.post('/planes', planData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Plan created:', response.data);
      // Ensure the response always has a 'plan' property
      return { 
        plan: response.data.plan || response.data 
      };
    } catch (error) {
      console.error('Error creating plan:', error);
      handleApiError(error);
      throw error;
    }
  },

  updatePlan: async (planId: string, planData: Partial<Plan>): Promise<{plan: Plan}> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Validate input
        if (!planId) {
          throw new Error('Plan ID is required');
        }

        // Ensure numeric price
        if (planData.price) {
          planData.price = parseFloat(planData.price.toString());
        }

        // Remove any empty features
        if (planData.features) {
          planData.features = planData.features.filter(f => f.trim() !== '');
        }

        const response = await apiClient.put(`/planes/${planId}`, {
          ...planData,
          updatedAt: new Date().toISOString()
        });

        resolve(response.data);
      } catch (error) {
        console.error('Error updating plan:', error);
        handleApiError(error);
        reject(error);
      }
    });
  },

  deletePlan: async (planId: string): Promise<void> => {
    try {
      console.log('Deleting plan:', planId);
      
      await apiClient.delete(`/planes/${planId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Plan deleted successfully');
    } catch (error) {
      console.error('Error deleting plan:', error);
      handleApiError(error);
      throw error;
    }
  },

  register: async (email: string, password: string, name: string): Promise<User> => {
    try {
      console.log('Registering user with:', email, password, name);
      
      const response = await apiClient.post('/register', { email, password, name }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Registration successful:', response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Registration error:', error);
      handleApiError(error);
      throw error;
    }
  },

  getAvailableTests: async (): Promise<Test[]> => {
    try {
      console.log('Fetching available tests from:', BASE_URL);
      
      const response = await apiClient.get('/tests', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Available tests received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching available tests:', error);
      handleApiError(error);
      throw error;
    }
  },

  getTestById: async (testId: string): Promise<Test> => {
    try {
      console.log('Fetching test by ID:', testId);
      
      const response = await apiClient.get(`/tests/${testId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Test received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching test by ID:', error);
      handleApiError(error);
      throw error;
    }
  },

  submitTestAnswers: async (testId: string, answers: UserAnswer[]): Promise<TestResult> => {
    try {
      console.log('Submitting test answers for:', testId);
      
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const { id } = JSON.parse(currentUser);

      const response = await apiClient.post('/test-results', { 
        userId: id,
        testId, 
        answers 
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Test answers submitted:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error submitting test answers:', error);
      
      handleApiError(error);
      throw error;
    }
  },

  getUserTestHistory: async (): Promise<TestResult[]> => {
    try {
      console.log('Fetching user test history from:', BASE_URL);
      
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const { id } = JSON.parse(currentUser);

      const response = await apiClient.get(`/user/${id}/test-history`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('User test history received:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user test history:', error);
      
      handleApiError(error);
      throw error;
    }
  },

  purchasePlan: async (planId: string): Promise<User> => {
    try {
      console.log('Purchasing plan with ID:', planId);
      
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        throw new Error('Usuario no encontrado. Por favor, inicia sesión nuevamente.');
      }

      const { id, email } = JSON.parse(currentUser);

      const response = await apiClient.post('/purchase-plan', { 
        userId: id, 
        email,
        planId 
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Plan purchased:', response.data.user);
      
      // Update local storage with new user data
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));

      return response.data.user;
    } catch (error) {
      console.error('Error purchasing plan:', error);
      
      handleApiError(error);
      throw error;
    }
  },

  login: async (email: string, password: string): Promise<User> => {
    try {
      console.log('Logging in with:', email);
      
      const response = await apiClient.post('/login', { email, password }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Login successful:', response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Login error:', error);
      handleApiError(error);
      throw error;
    }
  },
};

// Also export as default for alternative import styles
export default api;

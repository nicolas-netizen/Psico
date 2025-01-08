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

  // Test-related API methods
  createTest: async (testData: Partial<Test>) => {
    try {
      // Validate required fields
      if (!testData.title || !testData.description) {
        throw new Error('Título y descripción son obligatorios');
      }

      if (!testData.questions || testData.questions.length === 0) {
        throw new Error('Debe agregar al menos una pregunta');
      }

      if (!testData.plans || testData.plans.length === 0) {
        throw new Error('Debe seleccionar al menos un plan');
      }

      // Ensure all questions have valid data
      testData.questions.forEach((question, index) => {
        if (!question.text) {
          throw new Error(`La pregunta ${index + 1} requiere un texto`);
        }
        if (!question.options || question.options.length < 2) {
          throw new Error(`La pregunta ${index + 1} debe tener al menos 2 opciones`);
        }
        if (question.correctAnswer === undefined || question.correctAnswer < 0) {
          throw new Error(`La pregunta ${index + 1} requiere una respuesta correcta`);
        }
      });

      // Prepare data for submission
      const preparedTestData = {
        ...testData,
        id: testData.id || `test-${Date.now()}`,
        createdAt: testData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        difficulty: testData.difficulty || 'basic',
        timeLimit: testData.timeLimit || 30
      };

      // Make API call
      const response = await apiClient.post('/tests', preparedTestData);
      return response.data;
    } catch (error) {
      console.error('Error creating test:', error);
      
      // Extract meaningful error message
      const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Error al crear el test';
      
      throw new Error(errorMessage);
    }
  },

  getTestsForPlan: async (planId: string) => {
    try {
      const response = await apiClient.get(`/tests/plan/${planId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tests for plan:', error);
      throw error;
    }
  },

  getUserAvailableTests: async (userId: string, planId: string) => {
    try {
      const response = await apiClient.get(`/tests/user/${userId}/plan/${planId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available tests:', error);
      throw error;
    }
  },

  uploadFile: async (formData: FormData) => {
    try {
      const response = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  getTests: async () => {
    try {
      const response = await apiClient.get('/tests');
      return response.data;
    } catch (error) {
      console.error('Error fetching tests:', error);
      throw error;
    }
  },

  updateTest: async (testId: string, testData: Partial<Test>) => {
    try {
      const response = await apiClient.put(`/tests/${testId}`, testData);
      return response.data;
    } catch (error) {
      console.error('Error updating test:', error);
      throw error;
    }
  },

  deleteTest: async (testId: string) => {
    try {
      const response = await apiClient.delete(`/tests/${testId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting test:', error);
      throw error;
    }
  },

  saveTestHistory: async (testHistoryData: {
    userId: string;
    testId: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    completedAt: string;
  }) => {
    try {
      const response = await apiClient.post('/test-history', testHistoryData);
      return response.data;
    } catch (error) {
      console.error('Error saving test history:', error);
      throw error;
    }
  },

  getUserTestHistory: async (userId: string) => {
    try {
      const response = await apiClient.get(`/test-history/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user test history:', error);
      throw error;
    }
  },

  getTestsByPlan: async (planId: string) => {
    try {
      console.log('API: Fetching tests for Plan ID:', planId);
      
      const response = await apiClient.get(`/tests-by-plan/${planId}`);
      
      console.log('API: Received Tests:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('API: Error fetching tests for plan:', error);
      
      // Detailed error logging
      if (error.response) {
        console.error('API: Response Error Details', {
          status: error.response.status,
          data: JSON.stringify(error.response.data, null, 2),
          headers: error.response.headers
        });
      }
      
      const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Error al obtener los tests';
      
      throw new Error(errorMessage);
    }
  },

  getPlanById: async (planId: string) => {
    try {
      const response = await apiClient.get(`/plan/${planId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching plan details:', error);
      throw error;
    }
  },

  saveTestResult: async (testResult: {
    testId: string;
    userId: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    selectedAnswers: number[];
    completedAt: string;
  }) => {
    try {
      const response = await apiClient.post('/test-result', testResult);
      return response.data;
    } catch (error) {
      console.error('Error saving test result:', error);
      throw error;
    }
  },

  getUserTestHistory: async (userId?: string) => {
    try {
      if (!userId) throw new Error('User ID is required');
      
      const response = await apiClient.get(`/user-test-history/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user test history:', error);
      throw error;
    }
  },
};

// Also export as default for alternative import styles
export default api;

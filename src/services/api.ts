import axios from 'axios';
import fs from 'fs';
import path from 'path';
import type { Plan, User, Test, UserAnswer, TestResult, TestConfiguration, DetailedTestResult } from '../types';

// Function to read the current server port
function getCurrentServerPort(): string {
  try {
    const possiblePaths = [
      path.join(process.cwd(), 'server', 'current_port.txt'),
      path.join(process.cwd(), 'current_port.txt')
    ];

    for (const portFilePath of possiblePaths) {
      if (fs.existsSync(portFilePath)) {
        return fs.readFileSync(portFilePath, 'utf8').trim();
      }
    }

    console.warn('No port file found, using default port');
    return '3001';
  } catch (error) {
    console.warn('Error reading server port:', error);
    return '3001';
  }
}

// Determine base URL dynamically
const BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${getCurrentServerPort()}`;

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
    console.log('API Request:', config);
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
    console.log('API Response:', response);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    return Promise.reject(error);
  }
);

// Centralized error handling
function handleApiError(error: any) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      console.error('Server Error:', error.response.data);
      throw new Error(error.response.data.message || 'Error en la solicitud');
    } else if (error.request) {
      console.error('Network Error:', error.request);
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión de red.');
    } else {
      console.error('Request Setup Error:', error.message);
      throw new Error('Error al procesar la solicitud. Intenta nuevamente.');
    }
  } else {
    console.error('Unexpected Error:', error);
    throw new Error('Error inesperado. Por favor, contacta soporte.');
  }
}

// API methods
export const api = {
  pingServer: async () => {
    try {
      const response = await apiClient.get('/ping');
      console.log('Server connection:', response.data.message);
      return true;
    } catch (error) {
      console.error('Server connection failed:', error);
      return false;
    }
  },

  getPlans: async (): Promise<Plan[]> => {
    try {
      const response = await apiClient.get('/planes');
      const uniquePlans = response.data.filter(
        (plan: Plan, index: number, self: Plan[]) => 
          self.findIndex(p => p.id === plan.id) === index
      );
      return uniquePlans;
    } catch (error) {
      handleApiError(error);
    }
  },

  createPlan: async (planData: Partial<Plan>): Promise<{plan: Plan}> => {
    try {
      if (!planData.id) {
        planData.id = `plan-${Date.now()}`;
      }
      const response = await apiClient.post('/planes', planData);
      return { plan: response.data.plan || response.data };
    } catch (error) {
      handleApiError(error);
    }
  },

  updatePlan: async (planId: string, planData: Partial<Plan>): Promise<{plan: Plan}> => {
    try {
      if (!planId) throw new Error('Plan ID is required');
      if (planData.price) planData.price = parseFloat(planData.price.toString());
      if (planData.features) planData.features = planData.features.filter(f => f.trim() !== '');
      const response = await apiClient.put(`/planes/${planId}`, planData);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  deletePlan: async (planId: string): Promise<void> => {
    try {
      return apiClient.delete(`/plans/${planId}`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  purchasePlan: async (userId: string, planId: string): Promise<User> => {
    // Validate input before sending
    if (!userId) {
      console.error('Purchase Error: No userId provided');
      throw new Error('User ID is required');
    }
    if (!planId) {
      console.error('Purchase Error: No planId provided');
      throw new Error('Plan ID is required');
    }

    try {
      console.log('Attempting to purchase plan:', { userId, planId });
      const response = await apiClient.post('/purchase-plan', { 
        userId: userId.trim(), 
        planId: planId.trim() 
      });
      console.log('Purchase response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error purchasing plan:', error);
      // Log more details about the error
      if (axios.isAxiosError(error)) {
        console.error('Axios Error Details:', {
          response: error.response?.data,
          status: error.response?.status,
          message: error.message
        });
      }
      handleApiError(error);
      throw error;
    }
  },

  register: async (email: string, password: string, name: string): Promise<User> => {
    try {
      const response = await apiClient.post('/register', { email, password, name });
      return response.data.user;
    } catch (error) {
      handleApiError(error);
    }
  },

  login: async (email: string, password: string): Promise<User> => {
    try {
      const response = await apiClient.post('/login', { email, password });
      return response.data.user;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Other methods...

  getUserTestHistory: async (userId: string) => {
    try {
      const response = await apiClient.get(`/user-test-history/${userId}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getTests: async (): Promise<Test[]> => {
    try {
      const response = await apiClient.get('/tests');
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  getPlanById: async (planId: string) => {
    try {
      const response = await apiClient.get(`/plans/${planId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching plan by ID:', error);
      throw error;
    }
  },

  getTestsByPlan: async (planName: string) => {
    try {
      const response = await apiClient.get(`/tests?plan=${planName}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tests by plan:', error);
      throw error;
    }
  },

  getTestsByAptitude: async (aptitude: string): Promise<Test[]> => {
    try {
      const response = await apiClient.get(`/tests/aptitudes?aptitude=${encodeURIComponent(aptitude)}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  generateTest: async (configuration: TestConfiguration): Promise<Test> => {
    try {
      if (!configuration) {
        throw new Error('Test configuration is required');
      }

      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be logged in to generate a test');
      }

      const response = await apiClient.post('/tests/generate', { 
        configuration,
        userId: currentUser.id 
      });

      if (!response.data || !response.data.id) {
        throw new Error('Invalid test generation response');
      }

      return response.data;
    } catch (error) {
      console.error('Error generating test:', error);
      
      // More detailed error handling
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with a status code
          console.error('Server error details:', error.response.data);
          throw new Error(error.response.data.message || 'Failed to generate test');
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          throw new Error('No response from server. Please check your connection.');
        }
      }

      handleApiError(error);
      throw error;
    }
  },

  submitTest: async (testId: string, userAnswers: UserAnswer[]): Promise<DetailedTestResult> => {
    try {
      const response = await apiClient.post('/tests/submit', { 
        testId, 
        userAnswers,
        userId: getCurrentUser()?.id 
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting test:', error);
      handleApiError(error);
      throw error;
    }
  },

  getTestResults: async (testResultId: string) => {
    try {
      const response = await apiClient.get(`/tests/results/${testResultId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching test results:', error);
      throw error;
    }
  },

  getTestById: async (testId: string) => {
    try {
      const response = await apiClient.get(`/tests/${testId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching test:', error);
      throw error;
    }
  },

  submitTestAnswers: async (testId: string, answers: any[]) => {
    try {
      const userId = getCurrentUser()?.id;
      const response = await apiClient.post(`/tests/${testId}/submit`, {
        userId,
        userAnswers: answers.map(answer => ({
          questionId: answer.questionId,
          selectedOption: answer.selectedOption
        }))
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting test answers:', error);
      throw error;
    }
  },

  getTestErrorStatistics: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/tests/error-statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching test error statistics:', error);
      handleApiError(error);
      throw error;
    }
  },

  createTest: async (testData: Partial<Test>): Promise<Test> => {
    try {
      if (!testData.id) {
        testData.id = `test-${Date.now()}`;
      }
      const response = await apiClient.post('/tests', testData);
      return response.data.test || response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  updateTest: async (testId: string, testData: Partial<Test>): Promise<Test> => {
    try {
      if (!testId) throw new Error('Test ID is required');
      const response = await apiClient.put(`/tests/${testId}`, testData);
      return response.data.test || response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};

// Individual exports for easier importing
export const getTestById = api.getTestById;
export const submitTestAnswers = api.submitTestAnswers;
export const getTestResults = api.getTestResults;

// Utility function to get current logged-in user
function getCurrentUser(): User | null {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
}

// Also export as default for alternative import styles
export default api;

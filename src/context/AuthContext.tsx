import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types/User';
import type { Plan } from '../types/Plan';
import type { Test, UserAnswer, TestResult, TestConfiguration, QuestionCategory, QuestionDifficulty, Aptitude, AptitudeTest, AptitudeCategory } from '../types/Test';
import api from '../services/api';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  userRole: string;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  getAvailableTests: () => Promise<Test[]>;
  getTestById: (testId: string) => Promise<Test>;
  submitTestAnswers: (testId: string, answers: any[]) => Promise<TestResult>;
  getUserTestHistory: () => Promise<TestResult[]>;
  getPlans: () => Promise<Plan[]>;
  purchasePlan: (planId: string) => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  fetchAptitudeTests: () => Promise<AptitudeTest[]>;
  generateTest: (config: {
    type?: 'random' | 'aptitude' | 'category';
    requiredCategories?: Aptitude[];
    aptitude?: Aptitude;
    specificCategory?: AptitudeCategory;
  }) => Promise<Test>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ 
  children: React.ReactNode | ((context: AuthContextType) => React.ReactNode) 
}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('guest');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setIsAuthenticated(true);
        setUser(parsedUser);
        setUserRole(parsedUser.role || 'guest');
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const loggedInUser = await api.login(email, password);
      
      localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
      
      setIsAuthenticated(true);
      setUser(loggedInUser);
      setUserRole(loggedInUser.role || 'guest');
      
      navigate('/dashboard');
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      setUserRole('guest');
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const registeredUser = await api.register(email, password, name);
      
      localStorage.setItem('currentUser', JSON.stringify(registeredUser));
      
      setIsAuthenticated(true);
      setUser(registeredUser);
      setUserRole(registeredUser.role || 'guest');
      
      navigate('/dashboard');
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      setUserRole('guest');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
    setUser(null);
    setUserRole('guest');
    navigate('/login');
  };

  const getAvailableTests = async () => {
    return await api.getAvailableTests();
  };

  const getTestById = async (testId: string) => {
    return await api.getTestById(testId);
  };

  const submitTestAnswers = async (testId: string, answers: any[]) => {
    try {
      const result = await api.submitTestAnswers(testId, answers);
      return result;
    } catch (error) {
      console.error('Error submitting test answers:', error);
      throw error;
    }
  };

  const getUserTestHistory = async () => {
    return await api.getUserTestHistory();
  };

  const getPlans = async () => {
    return await api.getPlans();
  };

  const purchasePlan = async (planId: string) => {
    if (!user) {
      throw new Error('User must be logged in to purchase a plan');
    }
    const updatedUser = await api.purchasePlan(user.id, planId);
    setUser(updatedUser);
    // Update local storage to persist the new user state
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
    }
  };

  const fetchAptitudeTests = async (): Promise<AptitudeTest[]> => {
    try {
      return await api.getTestsByAptitude('Inteligencia Lingüística');
    } catch (error) {
      console.error('Error fetching aptitude tests:', error);
      throw error;
    }
  };

  const generateTest = async (config: {
    type?: 'random' | 'aptitude' | 'category';
    requiredCategories?: Aptitude[];
    aptitude?: Aptitude;
    specificCategory?: AptitudeCategory;
  }): Promise<Test> => {
    try {
      // Establecer un tipo por defecto si no se proporciona
      const testType = config.type || 'random';

      let availableTests = await api.getTests();

      // Filtrar tests según el tipo de configuración
      let selectedTest: Test;
      switch (testType) {
        case 'random':
          // Test completamente aleatorio
          selectedTest = availableTests[Math.floor(Math.random() * availableTests.length)];
          break;

        case 'aptitude':
          // Filtrar por aptitud específica
          if (!config.aptitude) {
            throw new Error('Aptitud requerida para generar test');
          }
          
          const aptitudeTests = availableTests.filter(
            test => test.aptitudeCategory === config.aptitude
          );
          
          // Filtrar por categoría específica si se proporciona
          const filteredTests = config.specificCategory 
            ? aptitudeTests.filter(test => test.category === config.specificCategory)
            : aptitudeTests;

          if (filteredTests.length === 0) {
            throw new Error('No hay tests disponibles para esta selección');
          }

          selectedTest = filteredTests[Math.floor(Math.random() * filteredTests.length)];
          break;

        case 'category':
          // Filtrar por categoría
          const categoryTests = availableTests.filter(
            test => test.category === config.specificCategory
          );

          if (categoryTests.length === 0) {
            throw new Error('No hay tests disponibles para esta categoría');
          }

          selectedTest = categoryTests[Math.floor(Math.random() * categoryTests.length)];
          break;

        default:
          // Fallback a test aleatorio
          selectedTest = availableTests[Math.floor(Math.random() * availableTests.length)];
      }

      // Aleatorizar preguntas
      const randomizedQuestions = selectedTest.questions
        .map(q => ({ ...q, sortOrder: Math.random() }))
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(({ sortOrder, ...rest }) => rest);

      return {
        ...selectedTest,
        questions: randomizedQuestions
      };
    } catch (error) {
      console.error('Error generando test:', error);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    userRole,
    loading,
    login,
    logout,
    register,
    getAvailableTests,
    getTestById,
    submitTestAnswers,
    getUserTestHistory,
    getPlans,
    purchasePlan,
    updateUser,
    fetchAptitudeTests,
    generateTest
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {typeof children === 'function' 
        ? children(contextValue) 
        : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const defaultAuthContext: AuthContextType = {
  isAuthenticated: false,
  user: null,
  userRole: 'guest',
  login: async () => {},
  register: async () => {},
  logout: () => {},
  getAvailableTests: async () => [],
  getTestById: async () => ({} as Test),
  submitTestAnswers: async () => ({} as TestResult),
  getUserTestHistory: async () => [],
  getPlans: async () => [],
  purchasePlan: async () => {},
  updateUser: () => {},
  fetchAptitudeTests: async () => [],
  generateTest: async () => ({} as Test),
  loading: true
};

export default defaultAuthContext;

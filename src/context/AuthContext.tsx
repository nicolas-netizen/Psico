import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types/User';
import type { Plan } from '../types/Plan';
import type { Test, UserAnswer, TestResult } from '../types/Test';
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
  submitTestAnswers: (testId: string, answers: UserAnswer[]) => Promise<TestResult>;
  getUserTestHistory: () => Promise<TestResult[]>;
  getPlans: () => Promise<Plan[]>;
  purchasePlan: (planId: string) => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('guest');
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

  const submitTestAnswers = async (testId: string, answers: UserAnswer[]) => {
    return await api.submitTestAnswers(testId, answers);
  };

  const getUserTestHistory = async () => {
    return await api.getUserTestHistory();
  };

  const getPlans = async () => {
    return await api.getPlans();
  };

  const purchasePlan = async (planId: string) => {
    const updatedUser = await api.purchasePlan(planId);
    setUser(updatedUser);
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user, 
        userRole, 
        login, 
        register, 
        logout,
        getAvailableTests,
        getTestById,
        submitTestAnswers,
        getUserTestHistory,
        getPlans,
        purchasePlan,
        updateUser
      }}
    >
      {children}
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
  updateUser: () => {}
};

export default defaultAuthContext;

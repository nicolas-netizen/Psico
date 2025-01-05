import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types/User';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string;
  userEmail: string | null;
  userPlan: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setIsAuthenticated(true);
      setUserRole(user.role || 'user');
      setUserEmail(user.email);
      setUserPlan(user.plan || null);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Verificar admin predeterminado
      if (email === 'admin@chapiri.com' && password === 'admin123') {
        const adminUser = {
          email: 'admin@chapiri.com',
          password: 'admin123',
          role: 'admin',
          plan: null,
          name: 'Admin'
        };
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        setIsAuthenticated(true);
        setUserRole('admin');
        setUserEmail(adminUser.email);
        setUserPlan(null);
        navigate('/dashboard', { replace: true });
        return;
      }

      // Obtener usuarios registrados
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);

      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      // Guardar usuario actual en localStorage
      localStorage.setItem('currentUser', JSON.stringify(user));
      setIsAuthenticated(true);
      setUserRole(user.role);
      setUserEmail(user.email);
      setUserPlan(user.plan);
      
      // Redirigir al dashboard después del login
      navigate('/dashboard', { replace: true });
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      // Verificar que no sea el email del admin
      if (email === 'admin@chapiri.com') {
        throw new Error('Este email no está disponible');
      }

      // Obtener usuarios existentes
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Verificar si el usuario ya existe
      if (users.some((u: any) => u.email === email)) {
        throw new Error('El email ya está registrado');
      }

      // Crear nuevo usuario
      const newUser = {
        email,
        password,
        name,
        role: 'user',
        plan: 'basic',
        createdAt: new Date().toISOString()
      };

      // Agregar a la lista de usuarios
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      // Guardar usuario actual
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      
      // Actualizar estado
      setIsAuthenticated(true);
      setUserRole('user');
      setUserEmail(email);
      setUserPlan('basic');
      
      // Redirigir al dashboard después del registro
      navigate('/dashboard', { replace: true });
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
    setUserRole('user');
    setUserEmail(null);
    setUserPlan(null);
    // Redirigir al home después del logout
    navigate('/', { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userRole,
        userEmail,
        userPlan,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

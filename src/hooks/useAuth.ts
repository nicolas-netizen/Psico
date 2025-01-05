import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    // Cargar el estado de autenticación al montar el componente
    const loadAuthState = () => {
      const authStatus = localStorage.getItem('isAuthenticated') === 'true';
      const role = localStorage.getItem('userRole');
      const email = localStorage.getItem('userEmail');
      const plan = localStorage.getItem('userPlan');

      setIsAuthenticated(authStatus);
      setUserRole(role);
      setUserEmail(email);
      setUserPlan(plan);
    };

    loadAuthState();

    // Escuchar cambios en el localStorage
    window.addEventListener('storage', loadAuthState);
    return () => window.removeEventListener('storage', loadAuthState);
  }, []);

  const login = (email: string, role: string, plan: string) => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', role);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userPlan', plan);

    setIsAuthenticated(true);
    setUserRole(role);
    setUserEmail(email);
    setUserPlan(plan);
  };

  const logout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPlan');

    setIsAuthenticated(false);
    setUserRole(null);
    setUserEmail(null);
    setUserPlan(null);
  };

  return {
    isAuthenticated,
    userRole,
    userEmail,
    userPlan,
    login,
    logout
  };
};

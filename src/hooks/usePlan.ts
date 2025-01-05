import { useState, useEffect } from 'react';
import type { User } from '../types/User';

export const usePlan = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = () => {
      const email = localStorage.getItem('userEmail');
      if (!email) return null;

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: User) => u.email === email);
      setCurrentUser(user || null);
    };

    loadUser();
  }, []);

  const updateUserPlan = (plan: 'basic' | 'premium' | 'annual') => {
    const email = localStorage.getItem('userEmail');
    if (!email) return false;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((u: User) => u.email === email);
    
    if (userIndex === -1) return false;

    // Actualizar el plan del usuario
    users[userIndex].plan = plan;
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('userPlan', plan);
    
    // Actualizar el estado local
    setCurrentUser(users[userIndex]);
    
    return true;
  };

  return {
    currentUser,
    updateUserPlan,
  };
};

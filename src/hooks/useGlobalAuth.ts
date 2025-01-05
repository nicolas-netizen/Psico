import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

export const useGlobalAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useGlobalAuth must be used within an AuthProvider');
  }
  return context;
};

export default useGlobalAuth;

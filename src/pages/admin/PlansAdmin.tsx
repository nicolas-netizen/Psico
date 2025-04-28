import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PlansAdmin = () => {
  const navigate = useNavigate();
  
  // Redirigir a la página del dashboard cuando intenten acceder a esta página
  useEffect(() => {
    navigate('/admin/dashboard');
  }, [navigate]);
  
  // Este componente no rendereará nada ya que redirige inmediatamente
  return null;
};

export default PlansAdmin;

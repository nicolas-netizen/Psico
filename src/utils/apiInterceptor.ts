import axios from 'axios';
import { auth } from '../firebase/firebaseConfig';
import { logger } from './logger';
import { checkRateLimit, validateAuthToken, securityHeaders } from './security';

const api = axios.create({
  baseURL: process.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    ...securityHeaders,
    'Content-Type': 'application/json'
  }
});

// Interceptor de solicitud
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Verificar rate limiting
      if (!checkRateLimit(user.uid)) {
        throw new Error('Rate limit exceeded');
      }

      // Obtener token fresco
      const token = await user.getIdToken(true);
      
      // Validar token
      const isValid = await validateAuthToken(token);
      if (!isValid) {
        throw new Error('Invalid token');
      }

      // Agregar token a headers
      config.headers.Authorization = `Bearer ${token}`;

      // Agregar timestamp para prevenir replay attacks
      config.headers['X-Request-Timestamp'] = Date.now().toString();

      return config;
    } catch (error) {
      logger.error('Request interceptor error', error as Error);
      return Promise.reject(error);
    }
  },
  (error) => {
    logger.error('Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Interceptor de respuesta
api.interceptors.response.use(
  (response) => {
    // Validar headers de seguridad
    const securityHeadersPresent = Object.entries(securityHeaders).every(
      ([key, value]) => response.headers[key.toLowerCase()] === value
    );

    if (!securityHeadersPresent) {
      logger.warn('Missing security headers in response');
    }

    // Validar estructura de respuesta
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid response format');
    }

    return response;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Token expirado o inválido
          auth.signOut();
          break;
        case 403:
          logger.warn('Insufficient permissions');
          break;
        case 429:
          logger.warn('Rate limit exceeded');
          break;
        default:
          logger.error('API error', error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

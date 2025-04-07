import { auth } from '../firebase/firebaseConfig';
import { logger } from './logger';

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export const securityHeaders = {
  'Content-Security-Policy': 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseio.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://*.firebaseio.com https://firestore.googleapis.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com; " +
    "frame-src 'self' https://*.firebaseapp.com",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Rate limiting
const rateLimits = new Map<string, number[]>();
const MAX_REQUESTS = 100;
const TIME_WINDOW = 60000; // 1 minuto

export const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const userRequests = rateLimits.get(userId) || [];
  
  // Limpiar solicitudes antiguas
  const validRequests = userRequests.filter(time => now - time < TIME_WINDOW);
  
  if (validRequests.length >= MAX_REQUESTS) {
    logger.warn(`Rate limit exceeded for user ${userId}`);
    return false;
  }
  
  validRequests.push(now);
  rateLimits.set(userId, validRequests);
  return true;
};

// Validación de tokens
export const validateAuthToken = async (token: string): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    return !!user;
  } catch (error) {
    logger.error('Invalid auth token', error as Error);
    return false;
  }
};

// Sanitización de entrada
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Prevenir XSS
    .trim()
    .slice(0, 1000); // Limitar longitud
};

// Validación de permisos
export const checkPermissions = async (userId: string, requiredPermissions: string[]): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    const token = await user.getIdTokenResult();
    const claims = token.claims;
    
    return requiredPermissions.every(permission => claims[permission]);
  } catch (error) {
    logger.error('Error checking permissions', error as Error);
    return false;
  }
};

// Encriptación de datos sensibles
export const encryptSensitiveData = (data: string): string => {
  // Implementar encriptación aquí
  return Buffer.from(data).toString('base64');
};

export const decryptSensitiveData = (encryptedData: string): string => {
  // Implementar desencriptación aquí
  return Buffer.from(encryptedData, 'base64').toString();
};

// Validación de entrada
export const validateInput = (input: unknown, schema: Record<string, any>): boolean => {
  if (typeof input !== 'object' || !input) return false;
  
  for (const [key, validator] of Object.entries(schema)) {
    if (!(key in input) || !validator((input as any)[key])) {
      return false;
    }
  }
  
  return true;
};

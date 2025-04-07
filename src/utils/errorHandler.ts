import { toast } from 'react-toastify';
import { logger } from './logger';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

interface ErrorResponse {
  message: string;
  code?: string;
  handled: boolean;
}

export const handleError = (error: Error | AppError | unknown): ErrorResponse => {
  if (error instanceof AppError) {
    logger.error(error.message, error, { code: error.code });
    
    let userMessage = error.message;
    if (error instanceof ValidationError) {
      toast.error(userMessage);
    } else if (error instanceof AuthError) {
      toast.error('Error de autenticación. Por favor, inicia sesión nuevamente.');
    } else if (error instanceof NotFoundError) {
      toast.error('Recurso no encontrado.');
    }

    return {
      message: userMessage,
      code: error.code,
      handled: true,
    };
  }

  // Error desconocido
  const unknownError = error as Error;
  logger.error('Error no manejado', unknownError);
  toast.error('Ha ocurrido un error inesperado. Por favor, intenta de nuevo más tarde.');

  return {
    message: 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
    handled: false,
  };
};

export const withErrorHandler = async <T,>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    const errorResponse = handleError(error);
    logger.error(`Error en ${context || 'operación desconocida'}`, error as Error);
    throw new AppError(errorResponse.message, errorResponse.code);
  }
};

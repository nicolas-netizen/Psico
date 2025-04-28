import * as Sentry from '@sentry/react';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  message: string;
  level: LogLevel;
  timestamp: string;
  context?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;
  private sentryInitialized = false;

  private constructor() {
    try {
      // Inicializar Sentry solo si tenemos DSN configurado
      if (import.meta.env.VITE_SENTRY_DSN) {
        Sentry.init({
          dsn: import.meta.env.VITE_SENTRY_DSN,
          environment: import.meta.env.MODE,
          tracesSampleRate: 1.0,
        });
        this.sentryInitialized = true;
      } else {
        console.warn('Sentry DSN no configurado, el rastreo de errores está deshabilitado');
      }
    } catch (error) {
      console.warn('Error al inicializar Sentry:', error);
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = {
      message,
      level: 'info' as LogLevel,
      timestamp: new Date().toISOString(),
      context,
    };
    this.addLog(entry);
    
    // Solo mostrar logs en desarrollo
    if (import.meta.env.DEV) {
      console.info(`[INFO] ${message}`, context);
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = {
      message,
      level: 'warn' as LogLevel,
      timestamp: new Date().toISOString(),
      context,
    };
    this.addLog(entry);
    
    // Solo mostrar logs en desarrollo
    if (import.meta.env.DEV) {
      console.warn(`[WARN] ${message}`, context);
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    const entry = {
      message,
      level: 'error' as LogLevel,
      timestamp: new Date().toISOString(),
      context: { ...context, error: error?.toString() },
    };
    this.addLog(entry);
    
    // En producción, solo enviar a Sentry, sin mostrar en consola
    if (import.meta.env.DEV) {
      console.error(`[ERROR] ${message}`, error, context);
    }
    
    // Enviar a Sentry en todos los entornos solo si está inicializado
    if (error && this.sentryInitialized) {
      try {
        Sentry.captureException(error, {
          extra: context,
        });
      } catch (sentryError) {
        // Fallback a console.error si Sentry falla
        console.error('Error al enviar excepción a Sentry:', sentryError);
      }
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (import.meta.env.DEV) {
      const entry = {
        message,
        level: 'debug' as LogLevel,
        timestamp: new Date().toISOString(),
        context,
      };
      this.addLog(entry);
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();

// Sobrescribir los métodos de console en producción
if (import.meta.env.PROD) {
  // Implementación vacía para producción
  // Nota: Mantener console.error para errores críticos
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.debug = () => {};
}

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

  private constructor() {
    // Inicializar Sentry
    Sentry.init({
      dsn: process.env.VITE_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
    });
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
    if (process.env.NODE_ENV === 'development') {
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
    console.warn(`[WARN] ${message}`, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    const entry = {
      message,
      level: 'error' as LogLevel,
      timestamp: new Date().toISOString(),
      context: { ...context, error: error?.toString() },
    };
    this.addLog(entry);
    console.error(`[ERROR] ${message}`, error, context);
    
    // Enviar a Sentry
    if (error) {
      Sentry.captureException(error, {
        extra: context,
      });
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
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

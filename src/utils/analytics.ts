import { getAnalytics, logEvent as firebaseLogEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { analytics } from '../firebase/firebaseConfig';
import { logger } from './logger';

// Tipos de eventos
export enum EventType {
  PAGE_VIEW = 'page_view',
  AUTH_SUCCESS = 'login',
  AUTH_ERROR = 'login_error',
  SIGN_UP = 'sign_up',
  TEST_START = 'test_start',
  TEST_COMPLETE = 'test_complete',
  QUESTION_ANSWER = 'question_answer',
  SUBSCRIPTION_START = 'begin_checkout',
  SUBSCRIPTION_COMPLETE = 'purchase',
  SUBSCRIPTION_ERROR = 'payment_error',
  PROFILE_UPDATE = 'profile_update',
  FEATURE_USE = 'feature_use',
  USER_ENGAGEMENT = 'user_engagement',
  SEARCH = 'search',
  SHARE = 'share',
  ERROR = 'app_error'
}

interface User {
  id: string;
  email?: string;
  displayName?: string;
  role?: string;
  planId?: string;
}

// Inicializar analytics
let analyticsInitialized = false;

try {
  // Solo inicializar en cliente y en producción
  if (typeof window !== 'undefined' && analytics) {
    analyticsInitialized = true;
    logger.info('Firebase Analytics inicializado correctamente');
  }
} catch (error) {
  logger.error('Error al inicializar Analytics', error as Error);
}

// Rastrear eventos
export const trackEvent = (
  eventName: EventType | string,
  eventParams?: Record<string, any>
) => {
  try {
    if (!analyticsInitialized) {
      if (import.meta.env.DEV) {
        console.info(`[DEV Analytics Event]: ${eventName}`, eventParams);
      }
      return;
    }

    firebaseLogEvent(analytics, eventName, eventParams);
    logger.debug(`Evento registrado: ${eventName}`, eventParams);
  } catch (error) {
    logger.error(`Error al rastrear evento ${eventName}`, error as Error);
  }
};

// Identificar usuario
export const identifyUser = (user: User | null) => {
  try {
    if (!analyticsInitialized || !user) return;

    // Establecer ID de usuario
    setUserId(analytics, user.id);

    // Establecer propiedades de usuario
    setUserProperties(analytics, {
      plan: user.planId || 'free',
      role: user.role || 'user',
      display_name: user.displayName || ''
    });
    
    logger.debug('Usuario identificado en Analytics', { userId: user.id });
  } catch (error) {
    logger.error('Error al identificar usuario en Analytics', error as Error);
  }
};

// Rastrear vista de página
export const trackPageView = (pageName: string, pageParams?: Record<string, any>) => {
  trackEvent(EventType.PAGE_VIEW, {
    page_title: pageName,
    page_location: window.location.href,
    page_path: window.location.pathname,
    ...pageParams
  });
};

// Rastrear error de aplicación
export const trackError = (errorMessage: string, errorContext?: Record<string, any>) => {
  trackEvent(EventType.ERROR, {
    error_message: errorMessage,
    ...errorContext
  });
};

export default {
  trackEvent,
  identifyUser,
  trackPageView,
  trackError,
  EventType
};

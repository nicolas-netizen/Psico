import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export interface Plan {
  id?: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  isFeatured?: boolean;
  hasCustomTest?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Test {
  id?: string;
  title: string;
  description: string;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface TestResult {
  id?: string;
  userId: string;
  testId: string;
  score: number;
  answers: Array<{
    questionIndex: number;
    selectedAnswer: number;
  }>;
  completedAt: Timestamp;
}

export interface UserRole {
  email: string;
  role: 'admin' | 'user';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Question {
  id?: string;
  type: 'text' | 'memory' | 'distraction' | 'sequence';
  block: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface TextQuestion extends Question {
  type: 'text';
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface MemoryQuestion extends Question {
  type: 'memory';
  images: string[];  // URLs de las 4 imágenes
  correctImageIndex: number;  // Índice de la imagen correcta (0-3)
  followUpQuestion: {
    question: string;  // Pregunta sobre la imagen correcta
    options: string[];  // Opciones de respuesta
    correctAnswer: number;  // Índice de la respuesta correcta
  };
}

export interface DistractionQuestion extends Question {
  type: 'distraction';
  content: string;
  duration: number;
}

export interface SequenceQuestion extends Question {
  type: 'sequence';
  sequence: string[];
  correctOrder: number[];
}

export type QuestionType = TextQuestion | MemoryQuestion | DistractionQuestion | SequenceQuestion;

// Plans
export const getPlans = async (): Promise<Plan[]> => {
  try {
    const plansRef = collection(db, 'plans');
    const q = query(plansRef, orderBy('price', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Plan[];
  } catch (error) {
    console.error('Error fetching plans:', error);
    throw new Error('Error al obtener los planes');
  }
};

export const getPlanById = async (planId: string): Promise<Plan> => {
  try {
    const planRef = doc(db, 'plans', planId);
    const planDoc = await getDoc(planRef);
    
    if (!planDoc.exists()) {
      throw new Error('Plan no encontrado');
    }
    
    return {
      id: planDoc.id,
      ...planDoc.data()
    } as Plan;
  } catch (error) {
    console.error('Error fetching plan:', error);
    throw new Error('Error al obtener el plan');
  }
};

export const createPlan = async (planData: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const plansRef = collection(db, 'plans');
    const now = Timestamp.now();
    const newPlan = {
      ...planData,
      createdAt: now,
      updatedAt: now
    };
    const docRef = await addDoc(plansRef, newPlan);
    return docRef.id;
  } catch (error) {
    console.error('Error creating plan:', error);
    throw error;
  }
};

export const updatePlan = async (planId: string, planData: Partial<Omit<Plan, 'id' | 'createdAt'>>): Promise<void> => {
  try {
    const planRef = doc(db, 'plans', planId);
    await updateDoc(planRef, {
      ...planData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    throw error;
  }
};

export const deletePlan = async (planId: string): Promise<void> => {
  try {
    const planRef = doc(db, 'plans', planId);
    await deleteDoc(planRef);
  } catch (error) {
    console.error('Error deleting plan:', error);
    throw error;
  }
};

export const togglePlanFeatured = async (planId: string, isFeatured: boolean): Promise<void> => {
  try {
    const planRef = doc(db, 'plans', planId);
    await updateDoc(planRef, {
      isFeatured,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error toggling plan featured status:', error);
    throw error;
  }
};

export const getFeaturedPlan = async (): Promise<Plan | null> => {
  try {
    const plansRef = collection(db, 'plans');
    const q = query(plansRef, where('isFeatured', '==', true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Plan;
  } catch (error) {
    console.error('Error getting featured plan:', error);
    throw error;
  }
};

export const getFreePlan = async (): Promise<Plan | null> => {
  try {
    const plansRef = collection(db, 'plans');
    const q = query(plansRef, where('name', '==', 'Free'), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Si no existe el plan gratuito, lo creamos
      const freePlan = {
        name: 'Free',
        description: 'Plan gratuito con funcionalidades básicas',
        price: 0,
        features: [
          'Acceso a tests básicos',
          'Resultados básicos',
          'Soporte por email'
        ],
        hasCustomTest: false,
        isFeatured: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(plansRef, freePlan);
      return { id: docRef.id, ...freePlan };
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Plan;
  } catch (error) {
    console.error('Error getting free plan:', error);
    return null;
  }
};

export const assignFreePlanToUser = async (userId: string) => {
  try {
    const freePlan = await getFreePlan();
    const userPlanRef = doc(db, 'userPlans', userId);
    
    await setDoc(userPlanRef, {
      userId,
      planId: freePlan.id,
      startDate: Timestamp.now(),
      status: 'active'
    });
    
    return freePlan;
  } catch (error) {
    console.error('Error assigning free plan:', error);
    throw error;
  }
};

export const getUserPlan = async (userId: string) => {
  try {
    // Primero intentamos obtener el plan actual del usuario
    const userPlanRef = doc(db, 'userPlans', userId);
    const userPlanDoc = await getDoc(userPlanRef);
    
    if (!userPlanDoc.exists()) {
      // Si no tiene plan, le asignamos el gratuito
      return await assignFreePlanToUser(userId);
    }
    
    const userPlanData = userPlanDoc.data();
    const planRef = doc(db, 'plans', userPlanData.planId);
    const planDoc = await getDoc(planRef);
    
    if (!planDoc.exists()) {
      // Si el plan referenciado no existe, asignamos uno gratuito
      return await assignFreePlanToUser(userId);
    }
    
    return {
      id: planDoc.id,
      ...planDoc.data()
    } as Plan;
  } catch (error) {
    console.error('Error getting user plan:', error);
    throw error;
  }
};

// Tests
export const getTests = async (): Promise<Test[]> => {
  try {
    const testsRef = collection(db, 'tests');
    const querySnapshot = await getDocs(testsRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Test[];
  } catch (error) {
    console.error('Error fetching tests:', error);
    throw new Error('Error al obtener los tests');
  }
};

export const getTestById = async (testId: string): Promise<Test> => {
  try {
    const testRef = doc(db, 'tests', testId);
    const testDoc = await getDoc(testRef);
    
    if (!testDoc.exists()) {
      throw new Error('Test no encontrado');
    }
    
    return {
      id: testDoc.id,
      ...testDoc.data()
    } as Test;
  } catch (error) {
    console.error('Error fetching test:', error);
    throw new Error('Error al obtener el test');
  }
};

export const createInitialTest = async () => {
  try {
    console.log('Starting createInitialTest');
    const testsRef = collection(db, 'tests');
    const testQuery = query(testsRef, where('title', '==', 'Test de Ejemplo'));
    const testSnapshot = await getDocs(testQuery);

    if (testSnapshot.empty) {
      console.log('No test found, creating initial test');
      const testData = {
        title: 'Test de Ejemplo',
        description: 'Este es un test de ejemplo para demostrar la funcionalidad de la plataforma.',
        questions: [
          {
            question: '¿Cómo te sientes hoy?',
            options: ['Muy bien', 'Bien', 'Regular', 'Mal'],
            correctAnswer: 0
          },
          {
            question: '¿Has dormido bien últimamente?',
            options: ['Sí, muy bien', 'Regular', 'No muy bien', 'Tengo problemas para dormir'],
            correctAnswer: 0
          }
        ],
        status: 'active' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(testsRef, testData);
      console.log('Test created with ID:', docRef.id);
    } else {
      console.log('Test already exists');
    }
  } catch (error) {
    console.error('Error in createInitialTest:', error);
    throw error;
  }
};

// Test Results
export const saveTestResult = async (result: Omit<TestResult, 'id'>): Promise<string> => {
  try {
    const resultsRef = collection(db, 'testResults');
    const docRef = await addDoc(resultsRef, {
      ...result,
      completedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving test result:', error);
    throw new Error('Error al guardar el resultado del test');
  }
};

export const getUserTestResults = async (userId: string): Promise<TestResult[]> => {
  try {
    const resultsRef = collection(db, 'testResults');
    const q = query(
      resultsRef,
      where('userId', '==', userId),
      orderBy('completedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TestResult[];
  } catch (error) {
    console.error('Error fetching user test results:', error);
    throw new Error('Error al obtener los resultados de los tests');
  }
};

export const getRecentTestResults = async (userId: string, limit_: number = 5): Promise<TestResult[]> => {
  try {
    const resultsRef = collection(db, 'testResults');
    const q = query(
      resultsRef,
      where('userId', '==', userId),
      orderBy('completedAt', 'desc'),
      limit(limit_)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TestResult[];
  } catch (error) {
    console.error('Error fetching recent test results:', error);
    throw new Error('Error al obtener los resultados recientes');
  }
};

// User Stats
export const getUserStats = async (userId: string) => {
  try {
    const resultsRef = collection(db, 'testResults');
    const q = query(resultsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const results = querySnapshot.docs.map(doc => doc.data() as TestResult);
    
    const totalTests = results.length;
    const averageScore = totalTests > 0
      ? results.reduce((acc, curr) => acc + curr.score, 0) / totalTests
      : 0;
    
    const recentTests = results
      .sort((a, b) => b.completedAt.seconds - a.completedAt.seconds)
      .slice(0, 5);
    
    return {
      totalTests,
      averageScore,
      recentTests
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw new Error('Error al obtener las estadísticas del usuario');
  }
};

// User Roles
export const setUserRole = async (email: string, role: 'admin' | 'user'): Promise<void> => {
  try {
    const userRoleRef = doc(db, 'userRoles', email);
    const now = Timestamp.now();
    await setDoc(userRoleRef, {
      email,
      role,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
};

export const getUserRole = async (email: string): Promise<string> => {
  try {
    const userRef = doc(db, 'users', email);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return 'user';
    }

    return userDoc.data()?.role || 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
};

export const isUserAdmin = async (email: string): Promise<boolean> => {
  try {
    console.log('Checking admin status for:', email);
    const userRef = doc(db, 'users', email);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('User document not found');
      return false;
    }

    const userData = userDoc.data();
    const isAdmin = userData?.role === 'admin';
    console.log('User role:', userData?.role, 'Is admin:', isAdmin);
    return isAdmin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Initialize admin user
export const initializeAdminUser = async () => {
  try {
    const adminEmail = 'admin@chapiri.com';
    await setUserRole(adminEmail, 'admin');
    console.log('Admin user initialized successfully');
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
};

// Admin Stats
export const getAdminStats = async () => {
  try {
    // Get total users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnapshot.size;

    // Get total tests
    const testsSnapshot = await getDocs(collection(db, 'tests'));
    const totalTests = testsSnapshot.size;

    // Get test results for completion rate
    const resultsRef = collection(db, 'testResults');
    const resultsSnapshot = await getDocs(resultsRef);
    const totalResults = resultsSnapshot.size;

    // Calculate active users (users who have taken at least one test)
    const activeUsersSet = new Set();
    resultsSnapshot.docs.forEach(doc => {
      activeUsersSet.add(doc.data().userId);
    });

    return {
      totalUsers,
      activeUsers: activeUsersSet.size,
      totalTests,
      completionRate: totalUsers > 0 ? (totalResults / totalUsers) * 100 : 0
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    throw error;
  }
};

// Get all users with their stats
export const getAllUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = await Promise.all(
      usersSnapshot.docs.map(async (doc) => {
        const userData = doc.data();
        
        // Get test results for this user
        const resultsRef = collection(db, 'testResults');
        const q = query(resultsRef, where('userId', '==', doc.id));
        const resultsSnapshot = await getDocs(q);
        
        return {
          id: doc.id,
          email: userData.email || '',
          displayName: userData.displayName || '',
          lastActive: userData.lastActive?.toDate() || new Date(),
          testsCompleted: resultsSnapshot.size
        };
      })
    );
    
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Questions
export const getQuestions = async (): Promise<QuestionType[]> => {
  try {
    const questionsRef = collection(db, 'questions');
    const querySnapshot = await getDocs(questionsRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as QuestionType[];
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw new Error('Error al obtener las preguntas');
  }
};

export const createInitialQuestions = async () => {
  try {
    const questionsRef = collection(db, 'questions');
    const querySnapshot = await getDocs(questionsRef);
    
    if (querySnapshot.empty) {
      const initialQuestions = [
        {
          type: 'text',
          block: "Psicología Cognitiva",
          question: "¿Cuál es el principal objetivo de la psicología cognitiva?",
          options: [
            "Estudiar el comportamiento observable",
            "Analizar los procesos mentales",
            "Investigar el inconsciente",
            "Examinar las respuestas fisiológicas"
          ],
          correctAnswer: 1,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        },
        {
          type: 'text',
          block: "Desarrollo",
          question: "¿Qué teoría propuso Jean Piaget?",
          options: [
            "Teoría del desarrollo cognitivo",
            "Teoría del condicionamiento operante",
            "Teoría del psicoanálisis",
            "Teoría de la personalidad"
          ],
          correctAnswer: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        },
        {
          type: 'text',
          block: "Terapia",
          question: "¿Cuál es el enfoque principal de la terapia conductual?",
          options: [
            "Modificar pensamientos negativos",
            "Cambiar comportamientos problemáticos",
            "Explorar el pasado",
            "Analizar sueños"
          ],
          correctAnswer: 1,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        },
        {
          type: 'text',
          block: "Memoria",
          question: "¿Qué es la memoria de trabajo?",
          options: [
            "Almacenamiento a largo plazo",
            "Sistema de manipulación temporal de información",
            "Memoria autobiográfica",
            "Memoria sensorial"
          ],
          correctAnswer: 1,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      ];

      for (const question of initialQuestions) {
        await addDoc(questionsRef, question);
      }

      console.log('Initial questions created successfully');
    }
  } catch (error) {
    console.error('Error creating initial questions:', error);
    throw new Error('Error al crear las preguntas iniciales');
  }
};

export const createInitialPlans = async () => {
  try {
    const plansRef = collection(db, 'plans');
    const querySnapshot = await getDocs(plansRef);
    
    if (querySnapshot.empty) {
      const plans = [
        {
          name: 'Free',
          description: 'Plan gratuito con funcionalidades básicas',
          price: 0,
          features: [
            'Acceso a tests básicos',
            'Resultados básicos',
            'Soporte por email'
          ],
          hasCustomTest: false,
          isFeatured: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        },
        {
          name: 'Premium',
          description: 'Plan premium con todas las funcionalidades',
          price: 19.99,
          features: [
            'Acceso a todos los tests',
            'Tests personalizados',
            'Resultados detallados',
            'Soporte prioritario',
            'Sin anuncios'
          ],
          hasCustomTest: true,
          isFeatured: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      ];

      for (const plan of plans) {
        await addDoc(plansRef, plan);
      }

      console.log('Initial plans created successfully');
    }
  } catch (error) {
    console.error('Error creating initial plans:', error);
    throw new Error('Error al crear los planes iniciales');
  }
};

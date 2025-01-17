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
import { db } from '../config/firebase';

export interface Plan {
  id?: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  isFeatured?: boolean;
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
export const getAdminStats = async (): Promise<{
  totalUsers: number;
  activeUsers: number;
  totalTests: number;
  completionRate: number;
}> => {
  try {
    // Get total users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnapshot.size;

    // Get active users (users who have taken a test in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const testResultsSnapshot = await getDocs(
      query(
        collection(db, 'testResults'),
        where('completedAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
      )
    );
    
    const activeUserIds = new Set(
      testResultsSnapshot.docs.map(doc => doc.data().userId)
    );
    const activeUsers = activeUserIds.size;

    // Get total tests taken
    const totalTests = testResultsSnapshot.size;

    // Calculate completion rate (completed tests / total users who started tests)
    const completionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    return {
      totalUsers,
      activeUsers,
      totalTests,
      completionRate
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    throw error;
  }
};

// Get all users with their stats
export const getAllUsers = async (): Promise<Array<{
  id: string;
  email: string;
  displayName: string;
  lastActive: Date;
  testsCompleted: number;
}>> => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersPromises = usersSnapshot.docs.map(async (doc) => {
      const userData = doc.data();
      
      // Get user's test results
      const testResultsSnapshot = await getDocs(
        query(
          collection(db, 'testResults'),
          where('userId', '==', doc.id),
          orderBy('completedAt', 'desc')
        )
      );

      const lastActive = testResultsSnapshot.docs[0]?.data().completedAt?.toDate() || new Date(0);
      const testsCompleted = testResultsSnapshot.size;

      return {
        id: doc.id,
        email: userData.email || '',
        displayName: userData.displayName || '',
        lastActive,
        testsCompleted
      };
    });

    return Promise.all(usersPromises);
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

export const getUserPlan = async (userId: string) => {
  try {
    const userPlanQuery = query(
      collection(db, 'userPlans'),
      where('userId', '==', userId),
      where('active', '==', true),
      limit(1)
    );
    
    const planSnapshot = await getDocs(userPlanQuery);
    
    if (planSnapshot.empty) {
      return null;
    }

    const planDoc = planSnapshot.docs[0];
    return {
      id: planDoc.id,
      ...planDoc.data()
    };
  } catch (error) {
    console.error('Error getting user plan:', error);
    throw error;
  }
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  ActionCodeSettings
} from 'firebase/auth';
import { doc, getDoc, collection, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import { Test } from '../types/Test';
import { Plan } from '../types/Plan';

interface TestResult {
  userId: string;
  testId: string;
  score: number;
  answers: Array<{
    questionId: string;
    isCorrect: boolean;
    blockName: string;
  }>;
  blocks: Array<{
    type: string;
    correct: number;
    total: number;
  }>;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  getTestById: (testId: string) => Promise<Test>;
  submitTestResult: (testId: string, result: TestResult) => Promise<string>;
  getPlans: () => Promise<Plan[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Configuración para las acciones de email
  const actionCodeSettings: ActionCodeSettings = {
    url: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5173/__/auth/action'
      : 'https://psico-olive.vercel.app/__/auth/action',
    handleCodeInApp: true
  };

  // Función para verificar si un usuario es admin
  const checkAdminStatus = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      const userData = userDoc.data();
      return userData?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const adminStatus = await checkAdminStatus(user.uid);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const adminStatus = await checkAdminStatus(userCredential.user.uid);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, username?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        if (username) {
          await updateProfile(userCredential.user, {
            displayName: username
          });
        }
        await sendEmailVerification(userCredential.user, actionCodeSettings);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          displayName: username || '',
          role: 'user',
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerificationEmail = async () => {
    if (currentUser) {
      await sendEmailVerification(currentUser, actionCodeSettings);
    }
  };

  const getTestById = async (testId: string): Promise<Test> => {
    const testDoc = await getDoc(doc(db, 'tests', testId));
    if (!testDoc.exists()) {
      throw new Error('Test not found');
    }
    return { id: testDoc.id, ...testDoc.data() } as Test;
  };

  const submitTestResult = async (testId: string, result: TestResult): Promise<string> => {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      const testResultRef = doc(collection(db, 'testResults'));
      await setDoc(testResultRef, {
        ...result,
        submittedAt: serverTimestamp()
      });
      
      return testResultRef.id;
    } catch (error) {
      console.error('Error submitting test result:', error);
      throw error;
    }
  };

  const getPlans = async (): Promise<Plan[]> => {
    try {
      const plansSnapshot = await getDocs(collection(db, 'plans'));
      return plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Plan[];
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    isAdmin,
    login,
    register,
    logout,
    resetPassword,
    sendVerificationEmail,
    getTestById,
    submitTestResult,
    getPlans
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider, useAuth };

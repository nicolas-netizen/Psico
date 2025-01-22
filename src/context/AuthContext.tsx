import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, collection, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import { Test } from '../types/Test';
import { Plan } from '../types/Plan';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<string>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getTestById: (testId: string) => Promise<Test>;
  submitTestAnswers: (testId: string, answers: any[]) => Promise<void>;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const isUserAdmin = userDoc.exists() && userDoc.data()?.role === 'admin';
          setIsAdmin(isUserAdmin);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();
      const userRole = userData?.role || 'user';
      const isUserAdmin = userRole === 'admin';
      setIsAdmin(isUserAdmin);
      return userRole;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Crear documento de usuario con rol por defecto
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      role: 'user',
      createdAt: serverTimestamp()
    });
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setIsAdmin(false);
  };

  const getTestById = async (testId: string): Promise<Test> => {
    const testDoc = await getDoc(doc(db, 'tests', testId));
    if (!testDoc.exists()) {
      throw new Error('Test not found');
    }
    return { id: testDoc.id, ...testDoc.data() } as Test;
  };

  const submitTestAnswers = async (testId: string, answers: any[]) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    const testResultRef = collection(db, 'testResults');
    // Implementar la lógica de envío de respuestas
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
    getTestById,
    submitTestAnswers,
    getPlans
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider, useAuth };

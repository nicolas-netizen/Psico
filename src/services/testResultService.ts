import { db } from '../firebase/firebaseConfig';
import { collection, doc, getDoc, setDoc, deleteDoc, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';

export interface TestResult {
  id: string;
  userId: string;
  testId: string;
  score: number;
  totalQuestions: number;
  answers: Record<string, string>;
  completedAt: Date;
  testName?: string;
  testDescription?: string;
}

export const testResultService = {
  saveTestResult: async (result: Omit<TestResult, 'id'>): Promise<TestResult> => {
    try {
      const resultsRef = collection(db, 'testResults');
      const docRef = await addDoc(resultsRef, {
        ...result,
        completedAt: Timestamp.fromDate(result.completedAt)
      });

      return {
        ...result,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error al guardar el resultado del test:', error);
      throw new Error('No se pudo guardar el resultado del test');
    }
  },

  getUserResults: async (userId: string): Promise<TestResult[]> => {
    try {
      const resultsRef = collection(db, 'testResults');
      const q = query(resultsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const results: TestResult[] = [];
      
      querySnapshot.forEach((doc) => {
        try {
          const data = doc.data();
          console.log('Datos del resultado:', data); // Para debug

          // Convertir la fecha solo si existe y es un timestamp
          let completedAt = new Date();
          if (data.completedAt) {
            if (data.completedAt instanceof Timestamp) {
              completedAt = data.completedAt.toDate();
            } else if (data.completedAt.seconds) {
              // Si es un objeto con seconds, crear un nuevo Timestamp
              completedAt = new Timestamp(data.completedAt.seconds, data.completedAt.nanoseconds || 0).toDate();
            } else if (typeof data.completedAt === 'string') {
              // Si es un string, parsearlo como fecha
              completedAt = new Date(data.completedAt);
            }
          }

          // Asegurarse de que todos los campos requeridos existan
          if (!data.testId || !data.score || typeof data.totalQuestions !== 'number') {
            console.warn('Resultado incompleto encontrado:', doc.id);
            return;
          }

          results.push({
            id: doc.id,
            userId: data.userId,
            testId: data.testId,
            score: Number(data.score),
            totalQuestions: Number(data.totalQuestions),
            answers: data.answers || {},
            completedAt,
            testName: data.testName || undefined,
            testDescription: data.testDescription || undefined
          });
        } catch (error) {
          console.error('Error al procesar resultado individual:', error);
          // Continuar con el siguiente resultado en caso de error
        }
      });

      // Ordenar por fecha, más reciente primero
      return results.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
    } catch (error) {
      console.error('Error al obtener los resultados:', error);
      throw new Error('No se pudieron obtener los resultados');
    }
  },

  deleteResult: async (resultId: string): Promise<void> => {
    try {
      const resultRef = doc(db, 'testResults', resultId);
      await deleteDoc(resultRef);
    } catch (error) {
      console.error('Error al eliminar el resultado:', error);
      throw new Error('No se pudo eliminar el resultado');
    }
  },

  getResultById: async (resultId: string): Promise<TestResult> => {
    try {
      const resultRef = doc(db, 'testResults', resultId);
      const resultDoc = await getDoc(resultRef);
      
      if (!resultDoc.exists()) {
        throw new Error('Resultado no encontrado');
      }

      const data = resultDoc.data();
      return {
        ...data,
        id: resultDoc.id,
        completedAt: data.completedAt.toDate(),
      } as TestResult;
    } catch (error) {
      console.error('Error al obtener el resultado:', error);
      throw new Error('No se pudo obtener el resultado');
    }
  }
};

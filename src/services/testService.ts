import { db } from '../firebase/firebaseConfig';
import { collection, doc, getDoc, addDoc, getDocs, Timestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { generateRandomImages } from '../utils/imageUtils';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

interface Test {
  id: string;
  name: string;
  description: string;
  timeLimit: number;
  questions: Question[];
}

interface TestSubmission {
  testId: string;
  userId: string;
  answers: Record<string, string>;
  score: number;
}

interface TestQuestion {
  type: 'memory' | 'text';
  images?: string[];
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Test {
  id?: string;
  title: string;
  description: string;
  timeLimit: number;
  isPublic: boolean;
  blocks: number;
  imagesPerBlock: number;
  memorizeTime: number;
  distractionTime: number;
  questions?: TestQuestion[];
  createdAt?: any;
}

const validateQuestion = (question: any, index: number): Question => {
  console.log(`Validando pregunta ${index + 1}:`, JSON.stringify(question, null, 2));

  if (!question) {
    throw new Error(`La pregunta ${index + 1} es inválida`);
  }

  if (!question.text || typeof question.text !== 'string') {
    console.error(`Error en pregunta ${index + 1}: texto inválido:`, JSON.stringify(question.text, null, 2));
    throw new Error(`La pregunta ${index + 1} no tiene un texto válido`);
  }

  if (!Array.isArray(question.options) || question.options.length === 0) {
    console.error(`Error en pregunta ${index + 1}: opciones inválidas:`, JSON.stringify(question.options, null, 2));
    throw new Error(`La pregunta ${index + 1} no tiene opciones válidas`);
  }

  // Normalizar las opciones (eliminar espacios en blanco y asegurar que son strings)
  const normalizedOptions = question.options.map((opt: any) => String(opt).trim());
  
  // Manejar correctAnswer como índice o como valor directo
  let correctAnswer: string;
  if (typeof question.correctAnswer === 'number') {
    // Si es un número, usarlo como índice
    if (question.correctAnswer < 0 || question.correctAnswer >= normalizedOptions.length) {
      console.error(`Error en pregunta ${index + 1}: índice de respuesta correcta fuera de rango:`, {
        correctAnswerIndex: question.correctAnswer,
        optionsLength: normalizedOptions.length
      });
      throw new Error(`La pregunta ${index + 1} tiene un índice de respuesta correcta inválido`);
    }
    correctAnswer = normalizedOptions[question.correctAnswer];
  } else {
    // Si no es un número, tratar como valor directo
    correctAnswer = String(question.correctAnswer || '').trim();
    if (!normalizedOptions.includes(correctAnswer)) {
      console.error(`Error en pregunta ${index + 1}: respuesta correcta no encontrada en opciones:`, {
        correctAnswer,
        options: normalizedOptions
      });
      throw new Error(`La pregunta ${index + 1} no tiene una respuesta correcta válida`);
    }
  }

  const validatedQuestion = {
    id: question.id || `question-${index + 1}`,
    text: question.text,
    options: normalizedOptions,
    correctAnswer
  };

  console.log(`Pregunta ${index + 1} validada:`, JSON.stringify(validatedQuestion, null, 2));
  return validatedQuestion;
};

export const testService = {
  getAvailableTests: async (): Promise<Test[]> => {
    try {
      const testsRef = collection(db, 'tests');
      const querySnapshot = await getDocs(testsRef);
      
      const tests: Test[] = [];
      
      querySnapshot.forEach((doc) => {
        try {
          const testData = doc.data();
          
          // Validar datos básicos del test
          if (!testData.name || !Array.isArray(testData.questions)) {
            console.warn('Test inválido encontrado:', doc.id);
            return;
          }

          // Validar y normalizar preguntas
          const questions = testData.questions.map((q: any, index: number) => 
            validateQuestion(q, index)
          );

          const test: Test = {
            id: doc.id,
            name: testData.name,
            description: testData.description || 'Sin descripción',
            timeLimit: typeof testData.timeLimit === 'number' ? testData.timeLimit : 30,
            questions: questions
          };

          tests.push(test);
        } catch (error) {
          console.error(`Error al procesar test ${doc.id}:`, error);
        }
      });

      return tests;
    } catch (error) {
      console.error('Error al obtener los tests:', error);
      throw error;
    }
  },

  getTestById: async (testId: string): Promise<Test> => {
    try {
      const testDoc = await getDoc(doc(db, 'tests', testId));
      if (!testDoc.exists()) {
        throw new Error('Test no encontrado');
      }

      const testData = testDoc.data() as Test;
      console.log('Datos crudos del test:', testData);

      // Si el test no tiene preguntas, las generamos
      if (!testData.questions || testData.questions.length === 0) {
        const questions: TestQuestion[] = [];
        
        // Generar preguntas para cada bloque
        for (let block = 0; block < testData.blocks; block++) {
          const images = await generateRandomImages(testData.imagesPerBlock);
          const correctImageIndex = Math.floor(Math.random() * images.length);
          
          // Pregunta de memoria
          questions.push({
            type: 'memory',
            images: images,
            question: '¿Qué imagen estaba presente en el conjunto anterior?',
            options: images,
            correctAnswer: correctImageIndex
          });
        }

        // Actualizar el test con las preguntas generadas
        await updateDoc(doc(db, 'tests', testId), {
          questions: questions
        });

        testData.questions = questions;
      }

      return {
        id: testDoc.id,
        ...testData
      };
    } catch (error) {
      console.error('Error al obtener el test:', error);
      throw error;
    }
  },

  submitTest: async (data: TestSubmission): Promise<string> => {
    try {
      // Validar datos antes de enviar
      if (!data.testId || !data.userId || !data.answers || typeof data.score !== 'number') {
        throw new Error('Datos de envío incompletos');
      }

      // Verificar que todas las respuestas sean strings
      Object.entries(data.answers).forEach(([questionId, answer]) => {
        if (typeof answer !== 'string') {
          throw new Error(`Respuesta inválida para la pregunta ${questionId}`);
        }
      });

      const result = await addDoc(collection(db, 'testResults'), {
        ...data,
        submittedAt: new Date(),
      });

      console.log('Test enviado correctamente:', result.id);
      return result.id;
    } catch (error) {
      console.error('Error al enviar el test:', error);
      throw error;
    }
  },

  getTestByIdNew: async (testId: string): Promise<Test> => {
    try {
      const testDoc = await getDoc(doc(db, 'tests', testId));
      if (!testDoc.exists()) {
        throw new Error('Test no encontrado');
      }

      const testData = testDoc.data() as Test;
      console.log('Datos crudos del test:', testData);

      // Si el test no tiene preguntas, las generamos
      if (!testData.questions || testData.questions.length === 0) {
        const questions: TestQuestion[] = [];
        
        // Generar preguntas para cada bloque
        for (let block = 0; block < testData.blocks; block++) {
          const images = generateRandomImages(testData.imagesPerBlock);
          const correctImageIndex = Math.floor(Math.random() * images.length);
          
          // Pregunta de memoria
          questions.push({
            type: 'memory',
            images: images,
            question: '¿Qué imagen estaba presente en el conjunto anterior?',
            options: images,
            correctAnswer: correctImageIndex
          });
        }

        // Actualizar el test con las preguntas generadas
        await updateDoc(doc(db, 'tests', testId), {
          questions: questions
        });

        testData.questions = questions;
      }

      return {
        id: testDoc.id,
        ...testData
      };
    } catch (error) {
      console.error('Error al obtener el test:', error);
      throw error;
    }
  },

  createTest: async (testData: Omit<Test, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const newTest = {
        ...testData,
        createdAt: Timestamp.now(),
        questions: [] // Las preguntas se generarán cuando se acceda al test
      };

      const docRef = await addDoc(collection(db, 'tests'), newTest);
      return docRef.id;
    } catch (error) {
      console.error('Error al crear el test:', error);
      throw error;
    }
  },

  updateTest: async (testId: string, testData: Partial<Test>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'tests', testId), {
        ...testData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error al actualizar el test:', error);
      throw error;
    }
  },

  deleteTest: async (testId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'tests', testId));
    } catch (error) {
      console.error('Error al eliminar el test:', error);
      throw error;
    }
  },
};

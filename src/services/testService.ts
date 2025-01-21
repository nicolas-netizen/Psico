import { db } from '../firebase/firebaseConfig';
import { collection, doc, getDoc, addDoc, getDocs } from 'firebase/firestore';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

export interface Test {
  id: string;
  name: string;
  description: string;
  timeLimit: number;
  questions: Question[];
}

export interface TestSubmission {
  testId: string;
  userId: string;
  answers: Record<string, string>;
  score: number;
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
      const testRef = doc(db, 'tests', testId);
      const testDoc = await getDoc(testRef);
      
      if (!testDoc.exists()) {
        throw new Error('Test no encontrado');
      }

      const testData = testDoc.data();
      console.log('Datos crudos del test:', JSON.stringify(testData, null, 2));
      
      if (!testData) {
        throw new Error('Datos del test no válidos');
      }

      if (!Array.isArray(testData.questions)) {
        console.error('Estructura de preguntas inválida:', JSON.stringify(testData.questions, null, 2));
        throw new Error('El test no contiene preguntas válidas');
      }

      // Validar y normalizar cada pregunta
      const questions = testData.questions.map((q: any, index: number) => {
        try {
          console.log(`Procesando pregunta ${index + 1}:`, JSON.stringify(q, null, 2));
          return validateQuestion(q, index);
        } catch (error) {
          console.error(`Error al validar pregunta ${index + 1}:`, JSON.stringify(q, null, 2));
          throw error;
        }
      });

      const test: Test = {
        id: testDoc.id,
        name: testData.name || 'Test sin nombre',
        description: testData.description || 'Sin descripción',
        timeLimit: typeof testData.timeLimit === 'number' ? testData.timeLimit : 30,
        questions: questions
      };

      console.log('Test procesado:', JSON.stringify(test, null, 2));
      return test;
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
};

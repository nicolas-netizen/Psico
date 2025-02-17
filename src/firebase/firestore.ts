import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { createInitialQuestions } from './questions';

// Tests iniciales para la aplicación
const initialTests = [
  {
    title: 'Test de Memoria Visual Básico',
    description: 'Un test básico para evaluar tu memoria visual a corto plazo.',
    timeLimit: 15,
    isPublic: true,
    blocks: [
      {
        type: 'Memoria',
        quantity: 4
      },
      {
        type: 'Distracción',
        quantity: 2
      }
    ],
    memorizeTime: 30,
    distractionTime: 15,
    createdAt: new Date()
  },
  {
    title: 'Test de Memoria Avanzado',
    description: 'Desafía tus habilidades de memoria con más imágenes y menos tiempo.',
    timeLimit: 20,
    isPublic: true,
    blocks: [
      {
        type: 'Memoria',
        quantity: 6
      },
      {
        type: 'Texto',
        quantity: 2
      },
      {
        type: 'Memoria',
        quantity: 4
      }
    ],
    memorizeTime: 25,
    distractionTime: 15,
    createdAt: new Date()
  },
  {
    title: 'Test de Memoria Rápida',
    description: 'Prueba tu capacidad de memorización con tiempos más cortos.',
    timeLimit: 10,
    isPublic: true,
    blocks: [
      {
        type: 'Secuencia',
        quantity: 3
      },
      {
        type: 'Memoria',
        quantity: 4
      }
    ],
    memorizeTime: 20,
    distractionTime: 10,
    createdAt: new Date()
  }
];

export const initializeFirestore = async () => {
  try {
    // Inicializar preguntas
    await createInitialQuestions();

    // Verificar si ya existen tests públicos
    const testsQuery = query(collection(db, 'tests'), where('isPublic', '==', true));
    const existingTests = await getDocs(testsQuery);

    if (existingTests.empty) {
      // Si no hay tests públicos, crear los iniciales
      const promises = initialTests.map(test => addDoc(collection(db, 'tests'), test));
      await Promise.all(promises);
      console.log('Tests iniciales creados con éxito');
    } else {
      console.log('Ya existen tests públicos');
    }
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    throw new Error('Error al inicializar Firestore');
  }
};

export const getUserTests = async (userId: string) => {
  try {
    const testsQuery = query(collection(db, 'tests'), where('createdBy', '==', userId));
    const snapshot = await getDocs(testsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching user tests:', error);
    throw new Error('Error al obtener los tests del usuario');
  }
};

export const getPublicTests = async () => {
  try {
    const testsQuery = query(collection(db, 'tests'), where('isPublic', '==', true));
    const snapshot = await getDocs(testsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching public tests:', error);
    throw new Error('Error al obtener los tests públicos');
  }
};

import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface Block {
  id: string;
  type: 'Texto' | 'Memoria' | 'Distracción' | 'Secuencia';
  title: string;
  description: string;
  quantity: number;
  timeLimit?: number;
}

export const defaultBlocks: Omit<Block, 'id'>[] = [
  {
    type: 'Memoria',
    title: 'Memoria Visual',
    description: 'Memoriza las imágenes mostradas',
    quantity: 5,
    timeLimit: 60
  },
  {
    type: 'Distracción',
    title: 'Ejercicio de Distracción',
    description: 'Resuelve estas preguntas de distracción',
    quantity: 3,
    timeLimit: 120
  },
  {
    type: 'Texto',
    title: 'Preguntas de Memoria',
    description: 'Responde las preguntas sobre las imágenes que memorizaste',
    quantity: 5
  },
  {
    type: 'Secuencia',
    title: 'Secuencias Numéricas',
    description: 'Encuentra el siguiente número en la secuencia',
    quantity: 5
  }
];

export const initializeBlocks = async () => {
  try {
    // Verificar si ya existen bloques
    const blocksQuery = query(collection(db, 'blocks'));
    const existingBlocks = await getDocs(blocksQuery);

    if (!existingBlocks.empty) {
      console.log('Blocks already initialized');
      return;
    }

    // Crear los bloques por defecto
    const blockPromises = defaultBlocks.map(block => 
      addDoc(collection(db, 'blocks'), {
        ...block,
        createdAt: new Date()
      })
    );

    await Promise.all(blockPromises);
    console.log('Default blocks created successfully');
  } catch (error) {
    console.error('Error initializing blocks:', error);
    throw error;
  }
};

export const getBlocksByType = async (type: Block['type']) => {
  try {
    const blocksQuery = query(
      collection(db, 'blocks'),
      where('type', '==', type)
    );
    
    const snapshot = await getDocs(blocksQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Block[];
  } catch (error) {
    console.error('Error getting blocks by type:', error);
    throw error;
  }
};

import { collection, getDocs, addDoc, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { toast } from 'react-hot-toast';

export const initializeAdmin = async (userId: string) => {
  try {
    // Set user as admin
    await setDoc(doc(db, 'users', userId), {
      role: 'admin',
      email: 'admin@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });

    console.log('Admin role set successfully');
    return true;
  } catch (error) {
    console.error('Error setting admin role:', error);
    return false;
  }
};

export const initializeTestBlocks = async () => {
  try {
    const blocks = [
      {
        type: 'memory',
        name: 'Memoria Visual',
        description: 'Evalúa la capacidad de recordar y reconocer patrones visuales',
        defaultQuantity: 5,
        isActive: true,
        questions: [
          {
            type: 'multiple_choice',
            question: '¿Qué imagen estaba en la posición central?',
            options: ['Círculo rojo', 'Cuadrado azul', 'Triángulo verde', 'Estrella amarilla'],
            correctAnswer: 2
          }
        ]
      },
      {
        type: 'attention',
        name: 'Atención Selectiva',
        description: 'Evalúa la capacidad de mantener el foco en estímulos específicos',
        defaultQuantity: 4,
        isActive: true,
        questions: [
          {
            type: 'multiple_choice',
            question: 'Identifica el elemento diferente en la secuencia',
            options: ['Patrón A', 'Patrón B', 'Patrón C', 'Patrón D'],
            correctAnswer: 1
          }
        ]
      }
    ];

    const blocksRef = collection(db, 'testBlocks');
    
    // Check if blocks already exist
    const existingBlocks = await getDocs(blocksRef);
    if (!existingBlocks.empty) {
      console.log('Test blocks already exist');
      return;
    }

    // Add blocks
    for (const block of blocks) {
      await addDoc(blocksRef, block);
    }

    console.log('Test blocks initialized successfully');
    toast.success('Bloques de test inicializados correctamente');
  } catch (error) {
    console.error('Error initializing test blocks:', error);
    toast.error('Error al inicializar los bloques de test');
  }
};

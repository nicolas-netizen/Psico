import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const initialBlocks = [
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
      },
      {
        type: 'multiple_choice',
        question: '¿Cuántos objetos había en total en la imagen anterior?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 3
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
      },
      {
        type: 'multiple_choice',
        question: '¿Cuántas veces apareció el símbolo objetivo?',
        options: ['2 veces', '3 veces', '4 veces', '5 veces'],
        correctAnswer: 2
      }
    ]
  },
  {
    type: 'cognitive',
    name: 'Razonamiento Lógico',
    description: 'Evalúa la capacidad de resolver problemas y encontrar patrones',
    defaultQuantity: 3,
    isActive: true,
    questions: [
      {
        type: 'multiple_choice',
        question: 'Complete la secuencia: 2, 4, 8, 16, __',
        options: ['24', '32', '28', '20'],
        correctAnswer: 1
      },
      {
        type: 'multiple_choice',
        question: 'Si A > B y B > C, entonces...',
        options: [
          'C puede ser mayor que A',
          'A es definitivamente mayor que C',
          'No hay suficiente información',
          'B es mayor que A'
        ],
        correctAnswer: 1
      }
    ]
  },
  {
    type: 'emotional',
    name: 'Reconocimiento Emocional',
    description: 'Evalúa la capacidad de identificar y comprender emociones',
    defaultQuantity: 4,
    isActive: true,
    questions: [
      {
        type: 'multiple_choice',
        question: '¿Qué emoción expresa principalmente el rostro mostrado?',
        options: ['Alegría', 'Tristeza', 'Sorpresa', 'Miedo'],
        correctAnswer: 0
      },
      {
        type: 'multiple_choice',
        question: 'En la situación descrita, ¿qué emoción sería más apropiada?',
        options: ['Enojo', 'Empatía', 'Indiferencia', 'Frustración'],
        correctAnswer: 1
      }
    ]
  }
];

export const initializeTestBlocks = async () => {
  try {
    // Check if blocks already exist
    const blocksRef = collection(db, 'testBlocks');
    const q = query(blocksRef, where('isActive', '==', true));
    const existingBlocks = await getDocs(q);
    
    if (existingBlocks.empty) {
      console.log('Initializing test blocks...');
      
      // Add all blocks
      for (const block of initialBlocks) {
        await addDoc(blocksRef, block);
      }
      
      console.log('Test blocks initialized successfully');
      return true;
    } else {
      console.log('Test blocks already exist');
      return false;
    }
  } catch (error) {
    console.error('Error initializing test blocks:', error);
    throw error;
  }
};

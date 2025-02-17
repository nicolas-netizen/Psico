import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Preguntas iniciales para cada tipo de bloque
const initialQuestions = {
  Memoria: [
    {
      type: 'Memoria',
      images: [
        'https://firebasestorage.googleapis.com/v0/b/psico-test.appspot.com/o/memory%2Fimage1.jpg',
        'https://firebasestorage.googleapis.com/v0/b/psico-test.appspot.com/o/memory%2Fimage2.jpg',
        'https://firebasestorage.googleapis.com/v0/b/psico-test.appspot.com/o/memory%2Fimage3.jpg',
        'https://firebasestorage.googleapis.com/v0/b/psico-test.appspot.com/o/memory%2Fimage4.jpg'
      ],
      correctImageIndex: 0,
      isPublic: true
    }
  ],
  Texto: [
    {
      type: 'Texto',
      text: 'Juan tiene 5 manzanas. Le da 2 a María y recibe 3 de Pedro. ¿Cuántas manzanas tiene Juan ahora?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 3,
      isPublic: true
    },
    {
      type: 'Texto',
      text: 'Si un tren viaja a 60 km/h durante 2 horas, ¿cuántos kilómetros recorrerá?',
      options: ['90', '100', '120', '150'],
      correctAnswer: 2,
      isPublic: true
    }
  ],
  Distracción: [
    {
      type: 'Distracción',
      question: '¿Cuál es la capital de Francia?',
      options: ['Londres', 'Madrid', 'París', 'Roma'],
      correctAnswer: 2,
      isPublic: true
    },
    {
      type: 'Distracción',
      question: '¿Cuánto es 7 + 3?',
      options: ['8', '9', '10', '11'],
      correctAnswer: 2,
      isPublic: true
    }
  ],
  Secuencia: [
    {
      type: 'Secuencia',
      sequence: [1, 3, 5, 7],
      options: ['8', '9', '11', '13'],
      correctAnswer: 1,
      isPublic: true
    },
    {
      type: 'Secuencia',
      sequence: [2, 4, 8, 16],
      options: ['24', '32', '48', '64'],
      correctAnswer: 1,
      isPublic: true
    }
  ]
};

export const createInitialQuestions = async () => {
  try {
    // Verificar si ya existen preguntas
    const questionsQuery = query(collection(db, 'questions'));
    const existingQuestions = await getDocs(questionsQuery);

    if (existingQuestions.empty) {
      console.log('Creando preguntas iniciales...');
      // Si no hay preguntas, crear las iniciales
      for (const [type, questions] of Object.entries(initialQuestions)) {
        const promises = questions.map(question => 
          addDoc(collection(db, 'questions'), {
            ...question,
            createdAt: new Date()
          })
        );
        await Promise.all(promises);
      }
      console.log('Preguntas iniciales creadas con éxito');
    } else {
      console.log('Ya existen preguntas en la base de datos');
    }
  } catch (error) {
    console.error('Error creating initial questions:', error);
    throw new Error('Error al crear las preguntas iniciales');
  }
};

export const getQuestionsByType = async (type: string) => {
  try {
    console.log('Buscando preguntas de tipo:', type);
    const questionsQuery = query(
      collection(db, 'questions'),
      where('type', '==', type)
    );
    const snapshot = await getDocs(questionsQuery);
    console.log(`Encontradas ${snapshot.size} preguntas de tipo ${type}`);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching questions by type:', error);
    throw new Error('Error al obtener las preguntas por tipo');
  }
};

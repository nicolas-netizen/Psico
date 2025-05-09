import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Datos iniciales para los planes
const planes = [
  {
    name: 'Plan Básico',
    description: 'Ideal para comenzar',
    price: 0,
    features: [
      'Acceso a tests básicos',
      'Resultados inmediatos',
      'Reportes básicos'
    ],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    name: 'Plan Profesional',
    description: 'Para profesionales y estudiantes avanzados',
    price: 2999,
    features: [
      'Todos los tests disponibles',
      'Resultados detallados',
      'Reportes avanzados',
      'Análisis comparativo',
      'Soporte prioritario'
    ],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
];

// Datos iniciales para los tests
const tests = [
  {
    title: 'Test de Aptitud Verbal',
    description: 'Evalúa tu comprensión del lenguaje y vocabulario',
    questions: [
      {
        question: '¿Cuál es el sinónimo de "efímero"?',
        options: ['Duradero', 'Pasajero', 'Eterno', 'Constante'],
        correctAnswer: 1
      },
      {
        question: 'Complete la analogía: Libro es a Lectura como Radio es a...',
        options: ['Sonido', 'Música', 'Audición', 'Electricidad'],
        correctAnswer: 2
      }
    ],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: 'Test de Razonamiento Lógico',
    description: 'Evalúa tu capacidad de resolver problemas lógicos',
    questions: [
      {
        question: 'Si todos los A son B, y algunos B son C, entonces...',
        options: [
          'Todos los A son C',
          'Algunos A podrían ser C',
          'Ningún A es C',
          'Todos los C son A'
        ],
        correctAnswer: 1
      },
      {
        question: 'Complete la serie: 2, 4, 8, 16, ...',
        options: ['24', '32', '30', '28'],
        correctAnswer: 1
      }
    ],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
];

// Función para inicializar la base de datos
const initializeFirestore = async () => {
  try {
    // Agregar planes
    const planesRef = collection(db, 'plans');
    for (const plan of planes) {
      await addDoc(planesRef, plan);
      console.log('Plan agregado:', plan.name);
    }

    // Agregar tests
    const testsRef = collection(db, 'tests');
    for (const test of tests) {
      await addDoc(testsRef, test);
      console.log('Test agregado:', test.title);
    }

    console.log('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
};

// Ejecutar la inicialización
initializeFirestore();

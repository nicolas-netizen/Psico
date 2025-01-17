const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDRvnQPH3vvpFvVSGXKvZPtWK6d5CYZxGs",
  authDomain: "psico-6cd3b.firebaseapp.com",
  projectId: "psico-6cd3b",
  storageBucket: "psico-6cd3b.appspot.com",
  messagingSenderId: "1014806736515",
  appId: "1:1014806736515:web:f6c4e1c5d1b4e0d5b2d6e9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const plans = [
  {
    name: 'Plan Básico',
    description: 'Ideal para comenzar tu evaluación psicológica',
    price: 9.99,
    features: [
      'Acceso a tests básicos',
      'Resultados instantáneos',
      'Reporte básico',
      'Validez por 30 días'
    ]
  },
  {
    name: 'Plan Profesional',
    description: 'Para una evaluación psicológica completa',
    price: 19.99,
    features: [
      'Todos los tests disponibles',
      'Resultados detallados',
      'Reporte profesional',
      'Seguimiento personalizado',
      'Validez por 30 días'
    ]
  },
  {
    name: 'Plan Premium',
    description: 'La experiencia más completa de evaluación',
    price: 29.99,
    features: [
      'Acceso ilimitado a todos los tests',
      'Resultados detallados con gráficos',
      'Reporte premium con recomendaciones',
      'Seguimiento personalizado',
      'Consulta con especialista',
      'Validez por 30 días'
    ]
  }
];

async function initializePlans() {
  try {
    console.log('Iniciando la creación de planes...');
    
    // Agregar cada plan a Firestore
    for (const plan of plans) {
      const docRef = await addDoc(collection(db, 'plans'), {
        ...plan,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Plan creado con ID:', docRef.id);
    }
    
    console.log('Planes inicializados correctamente');
  } catch (error) {
    console.error('Error inicializando planes:', error);
  }
}

// Ejecutar la inicialización
initializePlans();

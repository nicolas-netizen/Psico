const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDRvnQPH3vvpFvVSGXKvZPtWK6d5CYZxGs",
  authDomain: "psico-6cd3b.firebaseapp.com",
  projectId: "psico-6cd3b",
  storageBucket: "psico-6cd3b.appspot.com",
  messagingSenderId: "1014806736515",
  appId: "1:1014806736515:web:f6c4e1c5d1b4e0d5b2d6e9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const plans = [
  {
    id: 'basic',
    name: 'Plan Básico',
    price: 1999,
    description: 'Ideal para comenzar tu preparación',
    features: [
      'Acceso a tests básicos',
      'Recursos de estudio fundamentales',
      'Seguimiento de progreso básico',
      'Soporte por email'
    ],
    recommended: false,
    featured: false
  },
  {
    id: 'pro',
    name: 'Plan Profesional',
    price: 3999,
    description: 'La mejor opción para una preparación completa',
    features: [
      'Acceso a todos los tests',
      'Recursos de estudio avanzados',
      'Seguimiento detallado de progreso',
      'Soporte prioritario',
      'Sesiones de práctica grupal',
      'Guías de estudio personalizadas'
    ],
    recommended: true,
    featured: true
  },
  {
    id: 'premium',
    name: 'Plan Premium',
    price: 5999,
    description: 'Preparación intensiva y personalizada',
    features: [
      'Todo lo incluido en el Plan Profesional',
      'Mentoría personalizada',
      'Sesiones de práctica individual',
      'Análisis detallado de resultados',
      'Recursos exclusivos',
      'Acceso anticipado a nuevos materiales',
      'Soporte 24/7'
    ],
    recommended: false,
    featured: true
  }
];

async function initializePlans() {
  try {
    for (const plan of plans) {
      await setDoc(doc(db, 'plans', plan.id), {
        ...plan,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Plan ${plan.name} created successfully`);
    }
    console.log('All plans initialized successfully');
  } catch (error) {
    console.error('Error initializing plans:', error);
  }
}

initializePlans();

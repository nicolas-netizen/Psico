import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAzqhfR0oaRhUKneV_ixCWqORvW31Ybfbk",
  authDomain: "psino-91747.firebaseapp.com",
  projectId: "psino-91747",
  storageBucket: "psino-91747.appspot.com",
  messagingSenderId: "141588048823",
  appId: "1:141588048823:web:de9dc0da762d0a0e2a5632",
  measurementId: "G-RPR0346S55"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const initializeAdmin = async () => {
  try {
    // Create admin user in Authentication
    const { user } = await createUserWithEmailAndPassword(
      auth,
      'admin@psico.com',
      'Admin123!'
    );

    // Create admin document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: 'admin@psico.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
      displayName: 'Administrador'
    });

    console.log('Admin user created successfully!');
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists');
    } else {
      console.error('Error creating admin user:', error);
    }
  } finally {
    process.exit(0);
  }
};

initializeAdmin();

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

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
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
// Usar persistencia local para mantener la sesión
setPersistence(auth, browserLocalPersistence);

export const db = getFirestore(app);

export default app;

import { initializeApp } from 'firebase/app';
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
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence);

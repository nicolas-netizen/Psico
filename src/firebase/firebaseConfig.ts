import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDNTECvDxOYxhLCQfPGZKlDgLpbkwNpKkA",
  authDomain: "psico-c4d4d.firebaseapp.com",
  projectId: "psico-c4d4d",
  storageBucket: "psico-c4d4d.appspot.com",
  messagingSenderId: "1050096971441",
  appId: "1:1050096971441:web:a1fd4d1e7b8f3e3d7e5e9a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;

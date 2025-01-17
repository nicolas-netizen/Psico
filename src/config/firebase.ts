// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Set auth persistence to session (will be cleared when browser/tab closes)
setPersistence(auth, browserSessionPersistence);

export { auth, db };
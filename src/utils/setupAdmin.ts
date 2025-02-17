import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { initializeTestBlocks } from './initializeTestBlocks';

export const setupAdmin = async (userId: string) => {
  try {
    // Check if user exists
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create admin user
      await setDoc(userRef, {
        role: 'admin',
        email: 'admin@example.com', // Replace with actual admin email
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Admin user created successfully');
    } else {
      // Update to admin role if not already
      if (userDoc.data()?.role !== 'admin') {
        await setDoc(userRef, { role: 'admin' }, { merge: true });
        console.log('User updated to admin role');
      }
    }

    // Initialize test blocks
    await initializeTestBlocks();
    
    console.log('Setup completed successfully');
  } catch (error) {
    console.error('Error in setup:', error);
    throw error;
  }
};

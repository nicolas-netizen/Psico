import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { createInitialQuestions } from '../firebase/questions';

export const resetQuestions = async () => {
  try {
    console.log('Eliminando preguntas existentes...');
    const questionsQuery = collection(db, 'questions');
    const snapshot = await getDocs(questionsQuery);
    
    const deletePromises = snapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
    console.log('Preguntas eliminadas con éxito');

    console.log('Creando nuevas preguntas...');
    await createInitialQuestions();
    console.log('Preguntas reinicializadas con éxito');
  } catch (error) {
    console.error('Error resetting questions:', error);
    throw new Error('Error al reinicializar las preguntas');
  }
};

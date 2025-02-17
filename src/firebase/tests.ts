import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Block } from './blocks';

export interface Question {
  id: string;
  type: 'Texto' | 'Memoria' | 'Distracción' | 'Secuencia';
  blockId?: string;
  text?: string;
  options?: string[];
  correctAnswer?: number;
  images?: string[];
  correctImageIndex?: number;
  sequence?: number[];
  isPublic: boolean;
}

export interface BlockConfig {
  id: string;
  type: string;
  title: string;
  description: string;
  quantity: number;
  timeLimit?: number;
  questions?: Question[];
}

export interface Test {
  id: string;
  title: string;
  description: string;
  blocks: BlockConfig[];
  isPublic: boolean;
  isTemporary?: boolean;
  createdBy?: string;
  createdAt?: Date;
}

export const createTemporaryTest = async (templateId: string, userId: string) => {
  try {
    console.log('Creating temporary test from template:', templateId);
    
    // Obtener el test template
    const templateDoc = await getDoc(doc(db, 'tests', templateId));
    if (!templateDoc.exists()) {
      throw new Error('Test template not found');
    }

    const templateData = templateDoc.data();
    console.log('Template data:', templateData);

    // Crear un nuevo test temporal con la misma estructura
    const temporaryTest = {
      ...templateData,
      isTemporary: true,
      createdBy: userId,
      createdAt: new Date(),
      blocks: templateData.blocks.map((block: BlockConfig) => {
        // Asegurarnos de que cada bloque tenga un ID
        const blockId = block.id || `block_${Math.random().toString(36).substr(2, 9)}`;
        return {
          ...block,
          id: blockId,
          questions: [] // Inicializar el array de preguntas vacío
        };
      })
    };

    console.log('Creating temporary test with data:', temporaryTest);

    // Guardar el test temporal
    const testRef = await addDoc(collection(db, 'tests'), temporaryTest);
    console.log('Temporary test created with ID:', testRef.id);

    return { id: testRef.id, ...temporaryTest } as Test;
  } catch (error) {
    console.error('Error creating temporary test:', error);
    throw error;
  }
};

export const loadBlockQuestions = async (blockId: string, blockType: string, quantity: number) => {
  try {
    console.log('Loading questions for block:', blockId, 'type:', blockType);
    
    if (!blockType) {
      throw new Error('Block type is required');
    }

    // Primero intentamos cargar preguntas del bloque específico
    let questionsQuery;
    if (blockId) {
      questionsQuery = query(
        collection(db, 'questions'),
        where('blockId', '==', blockId),
        where('type', '==', blockType)
      );
    } else {
      questionsQuery = query(
        collection(db, 'questions'),
        where('type', '==', blockType)
      );
    }
    
    let questionsSnapshot = await getDocs(questionsQuery);
    console.log(`Found ${questionsSnapshot.size} block-specific questions`);
    
    // Si no hay suficientes preguntas específicas del bloque, cargamos preguntas generales del tipo
    if (questionsSnapshot.size < quantity) {
      console.log('Not enough block-specific questions, loading general questions');
      const generalQuestionsQuery = query(
        collection(db, 'questions'),
        where('type', '==', blockType)
      );
      
      const generalSnapshot = await getDocs(generalQuestionsQuery);
      console.log(`Found ${generalSnapshot.size} general questions`);
      
      // Combinar preguntas específicas y generales
      const allQuestions = [
        ...questionsSnapshot.docs,
        ...generalSnapshot.docs.filter(doc => !doc.data().blockId)
      ];
      
      // Seleccionar aleatoriamente la cantidad necesaria
      const selectedQuestions = allQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, quantity)
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Question[];
      
      return selectedQuestions;
    }
    
    // Si hay suficientes preguntas específicas del bloque
    const questions = questionsSnapshot.docs
      .sort(() => Math.random() - 0.5)
      .slice(0, quantity)
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Question[];
    
    return questions;
  } catch (error) {
    console.error('Error loading block questions:', error);
    throw error;
  }
};

export const updateTestQuestions = async (testId: string, blockIndex: number, questions: Question[]) => {
  try {
    console.log('Updating test questions:', testId, 'block:', blockIndex);
    
    const testDoc = await getDoc(doc(db, 'tests', testId));
    if (!testDoc.exists()) {
      throw new Error('Test not found');
    }
    
    const testData = testDoc.data();
    const blocks = [...testData.blocks];
    blocks[blockIndex] = {
      ...blocks[blockIndex],
      questions
    };
    
    await updateDoc(doc(db, 'tests', testId), { blocks });
    console.log('Test questions updated successfully');
    
    return { id: testDoc.id, ...testData, blocks } as Test;
  } catch (error) {
    console.error('Error updating test questions:', error);
    throw error;
  }
};

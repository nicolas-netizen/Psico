import { collection, getDocs, query, where, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

export const getUserTests = async (userId: string) => {
  try {
    const testsQuery = query(collection(db, 'tests'), where('createdBy', '==', userId));
    const snapshot = await getDocs(testsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching user tests:', error);
    throw new Error('Error al obtener los tests del usuario');
  }
};

export const updateUserLastTestDate = async (userId: string) => {
  try {
    console.log('=== ACTUALIZANDO FECHA DE ÚLTIMO TEST ===');
    console.log('Usuario:', userId);
    
    const userRef = doc(db, 'users', userId);
    const timestamp = Timestamp.now();
    
    await updateDoc(userRef, {
      lastTestDate: timestamp
    });
    
    console.log('Fecha actualizada a:', timestamp.toDate().toISOString());
    console.log('=== FIN ACTUALIZACIÓN DE FECHA ===');
  } catch (error) {
    console.error('Error updating last test date:', error);
    throw new Error('Error al actualizar la fecha del último test');
  }
};

export const canUserTakeTest = async (userId: string, testType?: string): Promise<boolean> => {
  try {
    console.log('=== VERIFICANDO PERMISOS PARA TOMAR TEST ===');
    console.log('User ID:', userId);
    console.log('Tipo de test:', testType || 'No especificado');

    // Si no es un test personalizado, no hay restricciones
    if (testType !== 'custom') {
      console.log('PERMITIDO: Test no es personalizado, no hay restricciones');
      return true;
    }

    if (!userId) {
      console.error('NO PERMITIDO: User ID no válido');
      return false;
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.error('NO PERMITIDO: Usuario no encontrado');
      return false;
    }

    const userData = userDoc.data();
    console.log('=== VERIFICANDO PLAN DEL USUARIO ===');
    console.log('Plan ID:', userData.planId || 'Sin plan');
    console.log('Último test:', userData.lastTestDate ? userData.lastTestDate.toDate().toLocaleString() : 'Nunca');

    // Si el usuario tiene un plan activo, puede tomar el test
    const currentDate = new Date();
    if (userData.planId) {
      const planRef = doc(db, 'plans', userData.planId);
      const planDoc = await getDoc(planRef);
      if (planDoc.exists()) {
        const planData = planDoc.data();
        const expiresAt = planData.expiresAt?.toDate();
        if (expiresAt && expiresAt > currentDate) {
          console.log('PERMITIDO: Usuario tiene plan activo válido');
          console.log('Plan expira:', expiresAt.toLocaleString());
          return true;
        } else {
          console.log('Plan expirado:', expiresAt ? expiresAt.toLocaleString() : 'No tiene fecha de expiración');
        }
      } else {
        console.log('Plan no encontrado en la base de datos');
      }
    } else {
      console.log('Usuario no tiene plan activo');
    }

    // Si el usuario no tiene plan activo, verificar si ya tomó un test personalizado hoy
    console.log('=== VERIFICANDO ÚLTIMO TEST ===');
    if (userData.lastTestDate) {
      const lastTestDate = userData.lastTestDate.toDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      console.log('Último test:', lastTestDate.toLocaleString());
      console.log('Hoy:', today.toLocaleString());

      // Convertir lastTestDate a medianoche para comparar solo las fechas
      const lastTestDay = new Date(lastTestDate);
      lastTestDay.setHours(0, 0, 0, 0);
      
      if (lastTestDay.getTime() === today.getTime()) {
        console.log('NO PERMITIDO: Usuario ya tomó un test personalizado hoy');
        return false;
      } else {
        console.log('El último test fue antes de hoy');
      }
    } else {
      console.log('Usuario no tiene tests previos');
    }

    console.log('PERMITIDO: Usuario puede tomar el test personalizado');
    return true;
  } catch (error) {
    console.error('ERROR GENERAL:', error);
    return false;
  }
};


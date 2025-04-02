import { collection, doc, updateDoc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { BaremoRule, BaremoCategory, BaremoConfig } from '../types/baremo';
import { db } from '../firebase/firebaseConfig';

const BAREMO_COLLECTION = 'baremo';
const CONFIG_DOC = 'config';

// Configuración inicial de ejemplo
const initialConfig: BaremoConfig = {
  categories: [
    {
      id: 'verbal',
      name: 'Aptitud Verbal',
      description: 'Evaluación de la capacidad de comprensión y uso del lenguaje',
      maxScore: 100,
      maxPoints: 20
    },
    {
      id: 'numerica',
      name: 'Aptitud Numérica',
      description: 'Evaluación de la capacidad de razonamiento con números',
      maxScore: 100,
      maxPoints: 20
    },
    {
      id: 'espacial',
      name: 'Aptitud Espacial',
      description: 'Evaluación de la capacidad de visualización y manipulación de objetos en el espacio',
      maxScore: 100,
      maxPoints: 20
    }
  ],
  rules: []
};

export const baremoService = {
  async initializeBaremoConfig(): Promise<void> {
    const configRef = doc(db, BAREMO_COLLECTION, CONFIG_DOC);
    const configSnap = await getDoc(configRef);
    
    if (!configSnap.exists()) {
      await setDoc(configRef, initialConfig);
    }
  },

  async getBaremoConfig(): Promise<BaremoConfig> {
    await this.initializeBaremoConfig(); // Asegurarse de que existe la configuración inicial

    const configRef = doc(db, BAREMO_COLLECTION, CONFIG_DOC);
    const configSnap = await getDoc(configRef);
    
    if (!configSnap.exists()) {
      throw new Error('No se pudo cargar la configuración del baremo');
    }

    return configSnap.data() as BaremoConfig;
  },

  async addCategory(category: BaremoCategory): Promise<void> {
    const configRef = doc(db, BAREMO_COLLECTION, CONFIG_DOC);
    const config = await this.getBaremoConfig();
    const categories = [...config.categories, category];
    await setDoc(configRef, { categories }, { merge: true });
  },

  async updateCategory(category: BaremoCategory): Promise<void> {
    const configRef = doc(db, BAREMO_COLLECTION, CONFIG_DOC);
    const config = await this.getBaremoConfig();
    const categories = config.categories.map((c: BaremoCategory) => 
      c.id === category.id ? category : c
    );
    await setDoc(configRef, { categories }, { merge: true });
  },

  async deleteCategory(categoryId: string): Promise<void> {
    const configRef = doc(db, BAREMO_COLLECTION, CONFIG_DOC);
    const config = await this.getBaremoConfig();
    const categories = config.categories.filter((c: BaremoCategory) => c.id !== categoryId);
    await setDoc(configRef, { categories }, { merge: true });
  },

  async createRule(rule: Omit<BaremoRule, 'id'>): Promise<void> {
    const ruleRef = doc(collection(db, BAREMO_COLLECTION));
    await setDoc(ruleRef, rule);
  },

  async updateRule(rule: BaremoRule): Promise<void> {
    const ruleRef = doc(db, BAREMO_COLLECTION, rule.id);
    const { id, ...ruleData } = rule;
    await updateDoc(ruleRef, ruleData);
  },

  async deleteRule(ruleId: string): Promise<void> {
    const ruleRef = doc(db, BAREMO_COLLECTION, ruleId);
    await deleteDoc(ruleRef);
  },

  calculatePoints(rules: BaremoRule[], categoryId: string, score: number): number {
    const categoryRules = rules.filter(rule => rule.category === categoryId);
    const matchingRule = categoryRules.find(
      rule => score >= rule.minScore && score <= rule.maxScore
    );
    return matchingRule ? matchingRule.points : 0;
  }
};

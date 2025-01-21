import { getFirestore } from 'firebase/firestore';
import { collection, doc, getDocs, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { BaremoRule, BaremoCategory, BaremoConfig } from '../types/baremo';
import { db } from '../firebase/firebaseConfig';

const BAREMO_COLLECTION = 'baremo';
const CONFIG_DOC = 'config';

export const baremoService = {
  async getBaremoConfig(): Promise<BaremoConfig> {
    const querySnapshot = await getDocs(collection(db, BAREMO_COLLECTION));
    const config: BaremoConfig = {
      categories: [],
      rules: []
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (doc.id === CONFIG_DOC) {
        config.categories = data.categories || [];
      } else {
        config.rules.push({ id: doc.id, ...data } as BaremoRule);
      }
    });

    return config;
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
    const categories = config.categories.map(c => 
      c.id === category.id ? category : c
    );
    await setDoc(configRef, { categories }, { merge: true });
  },

  async deleteCategory(categoryId: string): Promise<void> {
    const configRef = doc(db, BAREMO_COLLECTION, CONFIG_DOC);
    const config = await this.getBaremoConfig();
    const categories = config.categories.filter(c => c.id !== categoryId);
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

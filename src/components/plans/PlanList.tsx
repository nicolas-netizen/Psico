import { useEffect, useState } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import PlanCard from './PlanCard';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  popular?: boolean;
  type: 'free' | 'basic' | 'premium';
}

interface PlanListProps {
  hideActions?: boolean;
  maxPlans?: number;
}

const PlanList: React.FC<PlanListProps> = ({ hideActions = false, maxPlans }) => {
  const { currentUser } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansRef = collection(db, 'plans');
        const plansQuery = query(plansRef);
        const snapshot = await getDocs(plansQuery);
        
        let fetchedPlans = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Plan[];

        // Ordenar planes: primero los populares, luego por precio
        fetchedPlans.sort((a, b) => {
          if (a.popular && !b.popular) return -1;
          if (!a.popular && b.popular) return 1;
          return (a.price || 0) - (b.price || 0);
        });

        // Limitar el número de planes si se especifica maxPlans
        if (maxPlans) {
          fetchedPlans = fetchedPlans.slice(0, maxPlans);
        }

        setPlans(fetchedPlans);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [maxPlans]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-[#91c26a] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {plans.map((plan) => (
        <PlanCard 
          key={plan.id} 
          plan={plan} 
          hideActions={hideActions}
          isLoggedIn={!!currentUser}
        />
      ))}
    </div>
  );
};

export default PlanList;

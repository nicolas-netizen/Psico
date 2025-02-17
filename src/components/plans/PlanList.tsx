import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { toast } from 'react-hot-toast';
import { Check, X } from 'lucide-react';
import { purchasePlan } from '../../services/firestore';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  isFeatured: boolean;
}

interface DiscountCode {
  code: string;
  discountPercentage: number;
  validUntil: Date;
}

const PlanList = () => {
  const { currentUser } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'plans'));
        const plansData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Plan[];
        setPlans(plansData);
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast.error('Error al cargar los planes');
      }
    };

    fetchPlans();
  }, []);

  const validatePromoCode = async () => {
    setIsValidating(true);
    try {
      const codesRef = collection(db, 'discountCodes');
      const q = query(codesRef, where('code', '==', promoCode.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const codeData = querySnapshot.docs[0].data() as DiscountCode;
        if (new Date(codeData.validUntil) > new Date()) {
          setDiscount(codeData.discountPercentage);
          toast.success(`¡Código aplicado! ${codeData.discountPercentage}% de descuento`);
        } else {
          toast.error('Este código ha expirado');
          setDiscount(0);
        }
      } else {
        toast.error('Código no válido');
        setDiscount(0);
      }
    } catch (error) {
      console.error('Error validating code:', error);
      toast.error('Error al validar el código');
    } finally {
      setIsValidating(false);
    }
  };

  const handlePurchase = async (plan: Plan) => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para comprar un plan');
      return;
    }

    try {
      setIsValidating(true);
      const result = await purchasePlan(currentUser.uid, plan.id, promoCode || undefined);
      
      if (result.success) {
        toast.success(`¡Plan ${result.planName} actualizado exitosamente!`);
        setPromoCode('');
        setDiscount(0);
      }
    } catch (error) {
      console.error('Error purchasing plan:', error);
      toast.error('Error al procesar la compra');
    } finally {
      setIsValidating(false);
    }
  };

  const calculatePrice = (price: number) => {
    if (discount > 0) {
      return price * (1 - discount / 100);
    }
    return price;
  };

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Planes y Precios
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Elige el plan que mejor se adapte a tus necesidades
          </p>
        </div>

        <div className="mt-8">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Código promocional"
                className="px-4 py-2 border border-gray-300 rounded-l-md focus:ring-[#91c26a] focus:border-[#91c26a] block w-full sm:text-sm"
              />
              <button
                onClick={validatePromoCode}
                disabled={isValidating || !promoCode}
                className="absolute inset-y-0 right-0 px-4 py-2 bg-[#91c26a] text-white rounded-r-md hover:bg-[#82b35b] disabled:bg-gray-300"
              >
                Aplicar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-lg shadow-sm divide-y divide-gray-200 bg-white ${
                  plan.isFeatured ? 'border-2 border-[#91c26a]' : ''
                }`}
              >
                {plan.isFeatured && (
                  <div className="absolute top-0 right-0 -translate-y-1/2 transform">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#91c26a] text-white">
                      Recomendado
                    </span>
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                  <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                  <p className="mt-8">
                    <span className="text-4xl font-extrabold text-gray-900">
                      ${calculatePrice(plan.price).toFixed(2)}
                    </span>
                    <span className="text-base font-medium text-gray-500">/mes</span>
                  </p>
                  {discount > 0 && (
                    <p className="mt-2">
                      <span className="text-sm line-through text-gray-500">
                        ${plan.price.toFixed(2)}
                      </span>
                      <span className="ml-2 text-sm text-[#91c26a]">
                        {discount}% descuento aplicado
                      </span>
                    </p>
                  )}
                  <button
                    onClick={() => handlePurchase(plan)}
                    className="mt-8 block w-full bg-[#91c26a] text-white rounded-md py-2 text-sm font-semibold hover:bg-[#82b35b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#91c26a]"
                  >
                    Seleccionar Plan
                  </button>
                </div>

                <div className="pt-6 pb-8 px-6">
                  <h4 className="text-sm font-medium text-gray-900 tracking-wide uppercase">
                    Características
                  </h4>
                  <ul className="mt-4 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0">
                          <Check className="h-5 w-5 text-[#91c26a]" />
                        </div>
                        <p className="ml-3 text-sm text-gray-700">{feature}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanList;

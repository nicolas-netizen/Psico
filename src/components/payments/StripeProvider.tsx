import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Clave pública de Stripe para pruebas
// Esta es una clave de prueba genérica de Stripe que permite realizar pagos simulados
const stripePromise = loadStripe('pk_test_51OeYMXK4v0yCg9m0POcB82QHgZGPQ7gThLAJwbDoxo28fZJUyjYXCaRPIiUtLVvHfpgLuTgEQkDZyRVvuasZRmqf00A5RD8Ww9');

interface StripeProviderProps {
  children: React.ReactNode;
}

const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

export default StripeProvider;

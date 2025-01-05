import React from 'react';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import Features from '../components/Features';
import Testimonials from '../components/Testimonials';
import Plans from '../components/Plans';
import BaremoCalculator from '../components/BaremoCalculator';

const Home = () => {
  return (
    <>
      <Hero />
      <Stats />
      <Features />
      <Testimonials />
      <Plans />
      <BaremoCalculator />
    </>
  );
};

export default Home;

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

const FadeInView: React.FC<FadeInViewProps> = ({ 
  children, 
  delay = 0,
  direction = 'up' 
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const directionOffset = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ 
        opacity: 0,
        x: directionOffset[direction].x,
        y: directionOffset[direction].y
      }}
      animate={{
        opacity: inView ? 1 : 0,
        x: inView ? 0 : directionOffset[direction].x,
        y: inView ? 0 : directionOffset[direction].y,
      }}
      transition={{
        duration: 0.8,
        delay: delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
};

export default FadeInView;

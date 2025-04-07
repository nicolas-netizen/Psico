import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import FadeInView from './animations/FadeInView';
import { getDefaultProfileImage } from '../utils/defaultImages';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Ana García',
      role: 'Policía Nacional',
      content: 'La preparación fue clave para mi éxito. Los simulacros y el material específico me ayudaron a dominar cada tipo de prueba psicotécnica.',
      rating: 5
    },
    {
      name: 'Carlos Martínez',
      role: 'Guardia Civil',
      content: 'El seguimiento personalizado y los tests adaptados a mi nivel me permitieron mejorar constantemente. Totalmente recomendado.',
      rating: 5
    },
    {
      name: 'Laura Sánchez',
      role: 'Bombero',
      content: 'La plataforma es intuitiva y el método de estudio es muy efectivo. Los tutores siempre están disponibles para resolver dudas.',
      rating: 5
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInView>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Experiencias de éxito
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Conoce a quienes ya alcanzaron sus metas con nosotros
            </p>
          </div>
        </FadeInView>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-4xl mx-auto"
            >
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  <img 
                    src={getDefaultProfileImage(testimonials[currentIndex].name[0])} 
                    alt={testimonials[currentIndex].name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex mb-4">
                    {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <blockquote className="text-xl text-gray-700 italic mb-6">
                    "{testimonials[currentIndex].content}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonials[currentIndex].name}
                    </div>
                    <div className="text-[#91c26a]">
                      {testimonials[currentIndex].role}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevTestimonial}
              className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-[#91c26a]"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextTestimonial}
              className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-[#91c26a]"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full mx-1 transition-colors ${currentIndex === index ? "bg-[#91c26a]" : "bg-gray-300"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

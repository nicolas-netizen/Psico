import React, { useState } from 'react';

const BaremoCalculator = () => {
  const [formData, setFormData] = useState({
    education: 0,
    experience: 0,
    courses: 0,
    languages: 0,
  });

  const [total, setTotal] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: parseFloat(value),
    };
    setFormData(newFormData);

    // Calculate total
    const newTotal = Object.values(newFormData).reduce((acc, curr) => acc + curr, 0);
    setTotal(newTotal);
  };

  return (
    <section className="py-16 bg-white" id="baremo">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Calculadora de Baremo
          </h2>
          <p className="text-gray-600">
            Calcula tu puntuación adicional basada en tus méritos y estudios
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
          <div className="space-y-6">
            {/* Educación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de Educación
              </label>
              <select
                name="education"
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-[#91c26a] focus:border-[#91c26a]"
              >
                <option value="0">Selecciona tu nivel</option>
                <option value="2">Bachillerato</option>
                <option value="3">Grado Superior</option>
                <option value="4">Grado Universitario</option>
                <option value="5">Máster</option>
              </select>
            </div>

            {/* Experiencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experiencia Laboral
              </label>
              <select
                name="experience"
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-[#91c26a] focus:border-[#91c26a]"
              >
                <option value="0">Selecciona tus años de experiencia</option>
                <option value="1">1-2 años</option>
                <option value="2">3-5 años</option>
                <option value="3">Más de 5 años</option>
              </select>
            </div>

            {/* Cursos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cursos y Certificaciones
              </label>
              <select
                name="courses"
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-[#91c26a] focus:border-[#91c26a]"
              >
                <option value="0">Selecciona el número de cursos</option>
                <option value="0.5">1-2 cursos</option>
                <option value="1">3-5 cursos</option>
                <option value="1.5">Más de 5 cursos</option>
              </select>
            </div>

            {/* Idiomas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de Idiomas
              </label>
              <select
                name="languages"
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-[#91c26a] focus:border-[#91c26a]"
              >
                <option value="0">Selecciona tu nivel</option>
                <option value="1">B1</option>
                <option value="2">B2</option>
                <option value="3">C1 o superior</option>
              </select>
            </div>

            {/* Resultado */}
            <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Tu puntuación total de baremo es:</div>
                <div className="text-4xl font-bold text-[#91c26a]">{total.toFixed(2)} puntos</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BaremoCalculator;

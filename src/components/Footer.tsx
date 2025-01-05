import React from 'react';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Academia Chapiri</h3>
            <p className="text-gray-600 mb-4">
              Preparación especializada para tests psicotécnicos y oposiciones.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <Twitter className="w-6 h-6" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-600 hover:text-[#91c26a]">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/tests" className="text-gray-600 hover:text-[#91c26a]">
                  Tests
                </Link>
              </li>
              <li>
                <Link to="/recursos" className="text-gray-600 hover:text-[#91c26a]">
                  Recursos
                </Link>
              </li>
              <li>
                <Link to="/precios" className="text-gray-600 hover:text-[#91c26a]">
                  Precios
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recursos</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/blog" className="text-gray-600 hover:text-[#91c26a]">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/noticias" className="text-gray-600 hover:text-[#91c26a]">
                  Noticias
                </Link>
              </li>
              <li>
                <Link to="/faqs" className="text-gray-600 hover:text-[#91c26a]">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="text-gray-600 hover:text-[#91c26a]">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/terminos" className="text-gray-600 hover:text-[#91c26a]">
                  Términos de Uso
                </Link>
              </li>
              <li>
                <Link to="/privacidad" className="text-gray-600 hover:text-[#91c26a]">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-gray-600 hover:text-[#91c26a]">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100">
          <p className="text-center text-gray-500">
            {new Date().getFullYear()} Academia Chapiri. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

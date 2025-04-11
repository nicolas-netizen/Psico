import { Instagram, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Academia Chapiri</h3>
            <p className="text-gray-600 mb-4">
              Preparación especializada para tests psicotécnicos y oposiciones.
            </p>
            <a 
              href="https://instagram.com/academiachapiri" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-[#91c26a] flex items-center gap-2"
            >
              <Instagram className="w-5 h-5" />
              Síguenos en Instagram
            </a>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enlaces</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://discord.gg/tu-link" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-[#91c26a] flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Discord
                </a>
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
                <Link to="/legal/terminos" className="text-gray-600 hover:text-[#91c26a]">
                  Términos de Uso
                </Link>
              </li>
              <li>
                <Link to="/legal/privacidad" className="text-gray-600 hover:text-[#91c26a]">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link to="/legal/cookies" className="text-gray-600 hover:text-[#91c26a]">
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

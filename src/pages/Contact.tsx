import { Mail, MessageCircle } from 'lucide-react';

const Contact = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Contacto</h1>
      
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <MessageCircle className="w-8 h-8 text-[#91c26a]" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Discord</h2>
            <a 
              href="https://discord.gg/tu-link" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              Unirse a nuestra comunidad
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <Mail className="w-8 h-8 text-[#91c26a]" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Email</h2>
            <a 
              href="mailto:contacto@academiachapiri.com"
              className="text-blue-600 hover:text-blue-800"
            >
              contacto@academiachapiri.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

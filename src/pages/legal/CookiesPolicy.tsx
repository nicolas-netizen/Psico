

const CookiesPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Política de Cookies</h1>
      <div className="prose max-w-none">
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">1. ¿Qué son las Cookies?</h2>
          <p>Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita nuestra web. Nos ayudan a proporcionar funcionalidades esenciales y mejorar su experiencia.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">2. Tipos de Cookies que Utilizamos</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Cookies Esenciales</h3>
              <p>Necesarias para el funcionamiento básico del sitio y sus funcionalidades principales.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold">Cookies de Rendimiento</h3>
              <p>Nos ayudan a entender cómo los usuarios interactúan con nuestro sitio.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold">Cookies de Funcionalidad</h3>
              <p>Permiten recordar sus preferencias y personalizar su experiencia.</p>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">3. Gestión de Cookies</h2>
          <p>Puede controlar y/o eliminar las cookies según desee. Puede eliminar todas las cookies almacenadas en su dispositivo y configurar la mayoría de los navegadores para que no las acepten.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">4. Cookies de Terceros</h2>
          <p>Algunas cookies son colocadas por servicios de terceros que aparecen en nuestras páginas:</p>
          <ul className="list-disc pl-6">
            <li>Analíticas (Google Analytics)</li>
            <li>Autenticación (Firebase)</li>
            <li>Procesamiento de pagos</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">5. Duración de las Cookies</h2>
          <ul className="list-disc pl-6">
            <li>Cookies de sesión: se eliminan al cerrar el navegador</li>
            <li>Cookies persistentes: permanecen en su dispositivo por un tiempo determinado</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">6. Actualización de la Política</h2>
          <p>Esta política puede ser actualizada periódicamente. Los cambios entrarán en vigor inmediatamente después de su publicación.</p>
        </section>
      </div>
    </div>
  );
};

export default CookiesPolicy;

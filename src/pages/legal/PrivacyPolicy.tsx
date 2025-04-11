

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Política de Privacidad</h1>
      <div className="prose max-w-none">
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">1. Información que Recopilamos</h2>
          <p>Recopilamos la siguiente información:</p>
          <ul className="list-disc pl-6">
            <li>Información de registro (nombre, email)</li>
            <li>Resultados de tests y evaluaciones</li>
            <li>Información de uso de la plataforma</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">2. Uso de la Información</h2>
          <p>Utilizamos su información para:</p>
          <ul className="list-disc pl-6">
            <li>Proporcionar y mejorar nuestros servicios</li>
            <li>Personalizar su experiencia</li>
            <li>Enviar comunicaciones importantes</li>
            <li>Generar análisis y estadísticas anónimas</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">3. Protección de Datos</h2>
          <p>Implementamos medidas de seguridad para proteger su información personal, incluyendo:</p>
          <ul className="list-disc pl-6">
            <li>Encriptación de datos sensibles</li>
            <li>Acceso restringido a información personal</li>
            <li>Monitoreo regular de seguridad</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">4. Compartir Información</h2>
          <p>No compartimos su información personal con terceros, excepto:</p>
          <ul className="list-disc pl-6">
            <li>Cuando sea requerido por ley</li>
            <li>Con su consentimiento explícito</li>
            <li>Para proteger nuestros derechos legales</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">5. Sus Derechos</h2>
          <p>Usted tiene derecho a:</p>
          <ul className="list-disc pl-6">
            <li>Acceder a su información personal</li>
            <li>Corregir datos inexactos</li>
            <li>Solicitar la eliminación de sus datos</li>
            <li>Oponerse al procesamiento de sus datos</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">6. Contacto</h2>
          <p>Para cualquier consulta sobre su privacidad, puede contactarnos a través de los canales proporcionados en la sección de contacto.</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;



const TermsOfService = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Términos de Uso</h1>
      <div className="prose max-w-none">
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">1. Aceptación de los Términos</h2>
          <p>Al acceder y utilizar esta plataforma, usted acepta estar sujeto a estos términos de servicio. Si no está de acuerdo con alguna parte de los términos, no podrá acceder al servicio.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">2. Descripción del Servicio</h2>
          <p>Nuestra plataforma ofrece servicios de evaluación psicológica y tests psicométricos en línea. Los resultados proporcionados son orientativos y no constituyen un diagnóstico profesional.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">3. Cuentas de Usuario</h2>
          <p>Para acceder a ciertos servicios, deberá crear una cuenta. Usted es responsable de mantener la confidencialidad de su cuenta y contraseña.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">4. Uso del Servicio</h2>
          <ul className="list-disc pl-6">
            <li>No debe usar el servicio de manera fraudulenta o ilegal</li>
            <li>No debe intentar acceder a datos de otros usuarios</li>
            <li>No debe interferir con el funcionamiento normal del servicio</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">5. Planes y Pagos</h2>
          <p>Los precios y condiciones de los planes están sujetos a cambios. Cualquier modificación será notificada con anticipación.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">6. Cancelación del Servicio</h2>
          <p>Nos reservamos el derecho de suspender o terminar su acceso al servicio en caso de violación de estos términos.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">7. Limitación de Responsabilidad</h2>
          <p>No nos hacemos responsables por daños indirectos, incidentales o consecuentes derivados del uso del servicio.</p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

import { BottomNav } from "@/components/nav/bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Conoce cómo DOFLINS protege y maneja tus datos personales. Política de privacidad conforme a la Ley Federal de Protección de Datos Personales.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacidadPage(): React.JSX.Element {
  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 pb-28 sm:px-8 sm:pb-12">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ChevronLeftIcon className="h-4 w-4" /> Volver al inicio
            </Link>
          </Button>
        </div>

        <div className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#e6f2d0] px-4 py-1.5 text-sm font-semibold text-[var(--ink-900)]">
            <ShieldCheckIcon className="h-5 w-5" />
            Política de Privacidad
          </div>
          <h1 className="font-title text-4xl text-[var(--ink-900)] sm:text-5xl">
            Aviso de Privacidad
          </h1>
          <p className="text-sm text-[var(--ink-700)]">
            Última actualización: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Card className="border-[#d3debb] bg-gradient-to-br from-white to-[#f9faf5]">
          <CardContent className="prose prose-sm max-w-none space-y-6 p-6 sm:p-8">
            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">1. Responsable del tratamiento</h2>
              <p className="text-[var(--ink-700)]">
                <strong>DOFLINS</strong> (en adelante &quot;nosotros&quot; o &quot;DOFLINS&quot;), con domicilio en México, 
                es responsable del uso y protección de sus datos personales conforme a la Ley Federal 
                de Protección de Datos Personales en Posesión de los Particulares.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">2. Datos personales que recopilamos</h2>
              <p className="text-[var(--ink-700)]">Para cumplir las finalidades previstas en este aviso, podemos recabar:</p>
              <ul className="list-disc pl-6 text-[var(--ink-700)]">
                <li><strong>Datos de identificación:</strong> Nombre completo, correo electrónico</li>
                <li><strong>Datos de contacto:</strong> Dirección de envío, código postal, teléfono</li>
                <li><strong>Datos de compra:</strong> Historial de pedidos, productos adquiridos</li>
                <li><strong>Datos de navegación:</strong> Dirección IP, cookies, datos de uso del sitio</li>
              </ul>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">3. Finalidades del tratamiento</h2>
              <p className="text-[var(--ink-700)]">Sus datos personales serán utilizados para:</p>
              <ul className="list-disc pl-6 text-[var(--ink-700)]">
                <li>Procesar pedidos y realizar entregas</li>
                <li>Enviar confirmaciones de compra y seguimiento de envíos</li>
                <li>Gestionar pagos y facturación</li>
                <li>Atender consultas y proporcionar soporte al cliente</li>
                <li>Llevar un registro de tu colección DOFLINS (opcional)</li>
                <li>Mejorar nuestros productos y servicios</li>
                <li>Enviar comunicaciones promocionales (con tu consentimiento)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">4. Compartir información</h2>
              <p className="text-[var(--ink-700)]">
                No vendemos ni compartimos sus datos personales con terceros, excepto:
              </p>
              <ul className="list-disc pl-6 text-[var(--ink-700)]">
                <li><strong>Shopify:</strong> Plataforma de comercio electrónico para procesar pagos y pedidos</li>
                <li><strong>Proveedores de envío:</strong> Para entregar tus productos</li>
                <li><strong>Procesadores de pago:</strong> Para completar transacciones seguras</li>
                <li><strong>Autoridades:</strong> Cuando sea requerido por ley</li>
              </ul>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">5. Cookies y tecnologías de rastreo</h2>
              <p className="text-[var(--ink-700)]">
                Utilizamos cookies y tecnologías similares para mejorar tu experiencia, analizar el uso 
                del sitio y personalizar contenido. Puedes configurar tu navegador para rechazar cookies, 
                aunque esto puede afectar algunas funcionalidades del sitio.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">6. Tus derechos (ARCO)</h2>
              <p className="text-[var(--ink-700)]">Tienes derecho a:</p>
              <ul className="list-disc pl-6 text-[var(--ink-700)]">
                <li><strong>Acceder</strong> a tus datos personales</li>
                <li><strong>Rectificar</strong> datos inexactos o incompletos</li>
                <li><strong>Cancelar</strong> tus datos cuando consideres que no se requieren</li>
                <li><strong>Oponerte</strong> al tratamiento de tus datos para fines específicos</li>
                <li><strong>Revocar</strong> tu consentimiento en cualquier momento</li>
              </ul>
              <p className="text-[var(--ink-700)]">
                Para ejercer estos derechos, envía un correo a: <strong>privacidad@doflins.dofer.mx</strong> 
                (actualiza con tu correo real)
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">7. Seguridad de datos</h2>
              <p className="text-[var(--ink-700)]">
                Implementamos medidas de seguridad administrativas, técnicas y físicas para proteger 
                tus datos contra daño, pérdida, alteración, destrucción o acceso no autorizado.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">8. Cambios al aviso de privacidad</h2>
              <p className="text-[var(--ink-700)]">
                Nos reservamos el derecho de actualizar este aviso. Los cambios se publicarán en esta 
                página con la fecha de última actualización.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">9. Contacto</h2>
              <p className="text-[var(--ink-700)]">
                Para cualquier duda sobre este aviso de privacidad, contáctanos en:<br />
                <strong>Email:</strong> privacidad@doflins.dofer.mx (actualiza con tu correo real)
              </p>
            </section>

            <div className="mt-8 rounded-lg border-2 border-[#d8ca9e] bg-[#fff9e8] p-4">
              <p className="text-sm text-[var(--ink-700)]">
                <strong>Nota:</strong> Este aviso de privacidad es un formato base. Te recomendamos 
                revisarlo con un abogado para asegurar que cumple con todos los requisitos legales 
                aplicables a tu negocio y actualizar los correos electrónicos de contacto.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/terminos">Ver Términos y Condiciones</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/envios">Política de Envíos</Link>
          </Button>
        </div>
      </main>
      <BottomNav />
    </>
  );
}

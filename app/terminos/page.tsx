import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

import { SiteHeader } from "@/components/nav/site-header";
import { BottomNav } from "@/components/nav/bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y condiciones de uso de DOFLINS. Lee nuestras políticas antes de realizar una compra.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function TerminosPage(): React.JSX.Element {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 pb-28 sm:px-8 sm:pb-12">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ChevronLeftIcon className="h-4 w-4" /> Volver al inicio
            </Link>
          </Button>
        </div>

        <div className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#e6f2d0] px-4 py-1.5 text-sm font-semibold text-[#1f2a1a]">
            <DocumentTextIcon className="h-5 w-5" />
            Términos y Condiciones
          </div>
          <h1 className="font-title text-4xl text-[#1f2a1a] sm:text-5xl">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-sm text-[#3d5230]">
            Última actualización: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Card className="border-[#d3debb] bg-gradient-to-br from-white to-[#f9faf5]">
          <CardContent className="prose prose-sm max-w-none space-y-6 p-6 sm:p-8">
            <section>
              <h2 className="font-title text-2xl text-[#1f2a1a]">1. Aceptación de términos</h2>
              <p className="text-[#3d5230]">
                Al acceder y utilizar el sitio web <strong>doflins.dofer.mx</strong> (en adelante, "el Sitio"), 
                aceptas cumplir con estos Términos y Condiciones. Si no estás de acuerdo, te pedimos que no uses el Sitio.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[#1f2a1a]">2. Sobre DOFLINS</h2>
              <p className="text-[#3d5230]">
                DOFLINS es una marca de figuras coleccionables que incluye dos universos: <strong>Animals</strong> y 
                <strong> Multiverse</strong>. Cada figura tiene un sistema de rareza oficial (Común, Rara, Épica, Legendaria).
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[#1f2a1a]">3. Uso del sitio</h2>
              <p className="text-[#3d5230]">Te comprometes a:</p>
              <ul className="list-disc pl-6 text-[#3d5230]">
                <li>Utilizar el Sitio únicamente para fines lícitos</li>
                <li>No intentar acceder a áreas restringidas sin autorización</li>
                <li>No copiar, reproducir o distribuir contenido sin permiso</li>
                <li>Proporcionar información veraz al realizar compras</li>
                <li>No realizar actividades que puedan dañar, deshabilitar o sobrecargar el Sitio</li>
              </ul>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[#1f2a1a]">4. Compras y pagos</h2>
              <h3 className="font-semibold text-[#1f2a1a]">4.1 Proceso de compra</h3>
              <p className="text-[#3d5230]">
                Las compras se realizan a través de nuestra tienda Shopify. Al completar una compra, 
                aceptas pagar el precio mostrado más los costos de envío aplicables.
              </p>

              <h3 className="font-semibold text-[#1f2a1a]">4.2 Medios de pago</h3>
              <p className="text-[#3d5230]">
                Aceptamos tarjetas de crédito/débito, OXXO, SPEI y otros métodos disponibles en la plataforma de pago.
              </p>

              <h3 className="font-semibold text-[#1f2a1a]">4.3 Confirmación de pedido</h3>
              <p className="text-[#3d5230]">
                Recibirás un email de confirmación después de completar tu compra. Nos reservamos el derecho 
                de cancelar pedidos en caso de error de precio, falta de stock o sospecha de fraude.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[#1f2a1a]">5. Packs sorpresa y rareza</h2>
              <p className="text-[#3d5230]">
                Los packs de figuras DOFLINS son <strong>sorpresa</strong>. Esto significa que:
              </p>
              <ul className="list-disc pl-6 text-[#3d5230]">
                <li>No puedes elegir qué figura específica recibirás</li>
                <li>La rareza de la figura es aleatoria (puede ser Común, Rara, Épica o Legendaria)</li>
                <li>Pueden aparecer figuras repetidas si compras múltiples packs</li>
                <li>La información de rareza en el catálogo es oficial y verificable</li>
              </ul>
              <p className="text-[#3d5230]">
                <strong>Importante:</strong> Por la naturaleza de productos sorpresa, no aceptamos cambios ni 
                devoluciones por el tipo de figura o rareza recibida.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[#1f2a1a]">6. Envíos</h2>
              <p className="text-[#3d5230]">
                Realizamos envíos a toda la República Mexicana. Los tiempos de entrega varían según tu ubicación 
                (generalmente 3-7 días hábiles). Consulta nuestra <Link href="/envios" className="text-[#4e6f2a] underline">Política de Envíos</Link> para más detalles.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[#1f2a1a]">7. Devoluciones y reembolsos</h2>
              <p className="text-[#3d5230]">
                Aceptamos devoluciones únicamente en los siguientes casos:
              </p>
              <ul className="list-disc pl-6 text-[#3d5230]">
                <li>Producto defectuoso o dañado durante el envío</li>
                <li>Pack sellado que llegó sin abrir (dentro de 7 días naturales)</li>
                <li>Error en el envío (producto incorrecto)</li>
              </ul>
              <p className="text-[#3d5230]">
                <strong>No aceptamos devoluciones por:</strong>
              </p>
              <ul className="list-disc pl-6 text-[#3d5230]">
                <li>Packs ya abiertos (por la naturaleza sorpresa)</li>
                <li>Insatisfacción con la figura o rareza recibida</li>
                <li>Figuras repetidas</li>
              </ul>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[#1f2a1a]">8. Propiedad intelectual</h2>
              <p className="text-[#3d5230]">
                Todo el contenido del Sitio, incluyendo diseños, logos, textos, imágenes y modelos 3D, 
                es propiedad de DOFLINS y está protegido por leyes de propiedad intelectual. 
                No está permitido su uso sin autorización expresa.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[#1f2a1a]">9. Limitación de responsabilidad</h2>
              <p className="text-[#3d5230]">
                DOFLINS no se hace responsable por:
              </p>
              <ul className="list-disc pl-6 text-[#3d5230]">
                <li>Daños indirectos, incidentales o consecuentes derivados del uso del Sitio</li>
                <li>Retrasos en entregas causados por paqueterías o situaciones de fuerza mayor</li>
                <li>Pérdida de datos o interrupciones del servicio</li>
                <li>Contenido de terceros enlazado desde nuestro Sitio</li>
              </ul>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[#1f2a1a]">10. Modificaciones</h2>
              <p className="text-[#3d5230]">
                Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. 
                Los cambios entrarán en vigor al ser publicados en el Sitio.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[#1f2a1a]">11. Ley aplicable</h2>
              <p className="text-[#3d5230]">
                Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia 
                se resolverá en los tribunales competentes de México.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[#1f2a1a]">12. Contacto</h2>
              <p className="text-[#3d5230]">
                Para preguntas sobre estos términos, contáctanos en:<br />
                <strong>Email:</strong> legal@doflins.dofer.mx (actualiza con tu correo real)
              </p>
            </section>

            <div className="mt-8 rounded-lg border-2 border-[#d8ca9e] bg-[#fff9e8] p-4">
              <p className="text-sm text-[#3d5230]">
                <strong>Nota legal:</strong> Este documento es un formato base. Te recomendamos revisarlo 
                con un abogado especializado en comercio electrónico para asegurar que cumple con todos 
                los requisitos legales aplicables a tu negocio en México.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/privacidad">Ver Política de Privacidad</Link>
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

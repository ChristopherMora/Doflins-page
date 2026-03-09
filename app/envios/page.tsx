import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon, TruckIcon, MapPinIcon, ClockIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";

import { BottomNav } from "@/components/nav/bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Política de Envíos",
  description: "Información sobre tiempos de entrega, costos de envío y cobertura de DOFLINS en México.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function EnviosPage(): React.JSX.Element {
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
            <TruckIcon className="h-5 w-5" />
            Política de Envíos
          </div>
          <h1 className="font-title text-4xl text-[var(--ink-900)] sm:text-5xl">
            Envíos y Entregas
          </h1>
          <p className="text-lg text-[var(--ink-700)]">
            Hacemos llegar tus figuras DOFLINS a toda la República Mexicana
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Card className="border-[#d3debb]">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-[#e6f2d0] p-2">
                <ClockIcon className="h-6 w-6 text-[#4e6f2a]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--ink-900)]">Tiempo de entrega</h3>
                <p className="text-sm text-[var(--ink-700)]">3-7 días hábiles</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#d3debb]">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-[#e6f2d0] p-2">
                <MapPinIcon className="h-6 w-6 text-[#4e6f2a]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--ink-900)]">Cobertura</h3>
                <p className="text-sm text-[var(--ink-700)]">Todo México</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#d3debb]">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-[#e6f2d0] p-2">
                <CurrencyDollarIcon className="h-6 w-6 text-[#4e6f2a]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--ink-900)]">Costo</h3>
                <p className="text-sm text-[var(--ink-700)]">Calculado en checkout</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#d3debb]">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-[#e6f2d0] p-2">
                <TruckIcon className="h-6 w-6 text-[#4e6f2a]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--ink-900)]">Rastreo</h3>
                <p className="text-sm text-[var(--ink-700)]">Número de guía por email</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#d3debb] bg-gradient-to-br from-white to-[#f9faf5]">
          <CardContent className="prose prose-sm max-w-none space-y-6 p-6 sm:p-8">
            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">1. Cobertura de envíos</h2>
              <p className="text-[var(--ink-700)]">
                Realizamos envíos a <strong>toda la República Mexicana</strong>, incluyendo:
              </p>
              <ul className="list-disc pl-6 text-[var(--ink-700)]">
                <li>Zonas urbanas y metropolitanas</li>
                <li>Zonas rurales (pueden tener tiempos extendidos)</li>
                <li>Todas las colonias con código postal válido</li>
              </ul>
              <p className="text-[var(--ink-700)]">
                <strong>Importante:</strong> Verifica que tu código postal sea correcto para evitar demoras.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">2. Tiempos de entrega</h2>
              <p className="text-[var(--ink-700)]">Los tiempos estimados son:</p>
              
              <div className="not-prose space-y-3">
                <div className="rounded-lg border border-[#d3debb] bg-white p-4">
                  <h3 className="font-semibold text-[var(--ink-900)]">📍 Zona Metropolitana</h3>
                  <p className="text-sm text-[var(--ink-700)]">Ciudad de México, Monterrey, Guadalajara: <strong>3-5 días hábiles</strong></p>
                </div>
                
                <div className="rounded-lg border border-[#d3debb] bg-white p-4">
                  <h3 className="font-semibold text-[var(--ink-900)]">📍 Ciudades principales</h3>
                  <p className="text-sm text-[var(--ink-700)]">Capitales estatales y ciudades grandes: <strong>4-6 días hábiles</strong></p>
                </div>
                
                <div className="rounded-lg border border-[#d3debb] bg-white p-4">
                  <h3 className="font-semibold text-[var(--ink-900)]">📍 Zonas rurales</h3>
                  <p className="text-sm text-[var(--ink-700)]">Áreas remotas o de difícil acceso: <strong>5-7 días hábiles</strong></p>
                </div>
              </div>

              <p className="mt-4 text-[var(--ink-700)]">
                <strong>Nota:</strong> Los días hábiles son de lunes a viernes, excluyendo días festivos. 
                El tiempo empieza a contar una vez que el pedido es procesado y enviado.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">3. Costos de envío</h2>
              <p className="text-[var(--ink-700)]">
                El costo de envío se calcula automáticamente al finalizar tu compra según:
              </p>
              <ul className="list-disc pl-6 text-[var(--ink-700)]">
                <li>Tu código postal de entrega</li>
                <li>El peso y volumen del paquete</li>
                <li>La modalidad de envío seleccionada</li>
              </ul>
              
              <div className="mt-4 rounded-lg border-2 border-[#4e6f2a] bg-[#e6f2d0] p-4">
                <p className="font-semibold text-[var(--ink-900)]">🎁 Envío Gratis</p>
                <p className="text-sm text-[var(--ink-700)]">
                  Ofrecemos envío gratis en compras mayores a <strong>${process.env.NEXT_PUBLIC_FREE_GIFT_MIN_SUBTOTAL ?? "450"} pesos</strong>
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">4. Proceso de envío</h2>
              
              <div className="not-prose space-y-3">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4e6f2a] font-bold text-white">1</div>
                  <div>
                    <h3 className="font-semibold text-[var(--ink-900)]">Confirmación de pedido</h3>
                    <p className="text-sm text-[var(--ink-700)]">Recibes un email confirmando tu compra</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4e6f2a] font-bold text-white">2</div>
                  <div>
                    <h3 className="font-semibold text-[var(--ink-900)]">Preparación</h3>
                    <p className="text-sm text-[var(--ink-700)]">Preparamos tu paquete (1-2 días hábiles)</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4e6f2a] font-bold text-white">3</div>
                  <div>
                    <h3 className="font-semibold text-[var(--ink-900)]">Envío</h3>
                    <p className="text-sm text-[var(--ink-700)]">Tu pedido es enviado y recibes el número de rastreo</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4e6f2a] font-bold text-white">4</div>
                  <div>
                    <h3 className="font-semibold text-[var(--ink-900)]">Entrega</h3>
                    <p className="text-sm text-[var(--ink-700)]">Recibes tu paquete en la dirección indicada</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">5. Rastreo de pedido</h2>
              <p className="text-[var(--ink-700)]">
                Una vez enviado tu pedido, recibirás un email con:
              </p>
              <ul className="list-disc pl-6 text-[var(--ink-700)]">
                <li>Número de guía de rastreo</li>
                <li>Link directo al sistema de rastreo de la paquetería</li>
                <li>Fecha estimada de entrega</li>
              </ul>
              <p className="text-[var(--ink-700)]">
                Podrás consultar el estatus de tu envío en tiempo real.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">6. Empaque y seguridad</h2>
              <p className="text-[var(--ink-700)]">
                Todos nuestros paquetes son preparados con:
              </p>
              <ul className="list-disc pl-6 text-[var(--ink-700)]">
                <li>Embalaje protector para evitar daños durante el transporte</li>
                <li>Cajas de cartón resistente</li>
                <li>Material de relleno para productos frágiles</li>
                <li>Sellado seguro y discreto</li>
              </ul>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">7. Problemas con el envío</h2>
              <p className="text-[var(--ink-700)]">Si experimentas algún problema:</p>
              
              <h3 className="font-semibold text-[var(--ink-900)]">Paquete no llega en tiempo estimado</h3>
              <p className="text-[var(--ink-700)]">
                Contacta con nosotros después de 7 días hábiles. Investigaremos con la paquetería 
                y te mantendremos informado.
              </p>

              <h3 className="font-semibold text-[var(--ink-900)]">Paquete dañado</h3>
              <p className="text-[var(--ink-700)]">
                Si tu paquete llega dañado, toma fotos inmediatamente antes de abrirlo completamente 
                y contáctanos dentro de las primeras 24 horas.
              </p>

              <h3 className="font-semibold text-[var(--ink-900)]">Dirección incorrecta</h3>
              <p className="text-[var(--ink-700)]">
                Si proporcionaste una dirección incorrecta, contáctanos inmediatamente. Intentaremos 
                modificar el envío, pero pueden aplicar cargos adicionales.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">8. Días festivos y situaciones especiales</h2>
              <p className="text-[var(--ink-700)]">
                Los envíos pueden experimentar demoras durante:
              </p>
              <ul className="list-disc pl-6 text-[var(--ink-700)]">
                <li>Días festivos nacionales</li>
                <li>Temporadas de alta demanda (Hot Sale, Buen Fin, Navidad)</li>
                <li>Condiciones climáticas adversas</li>
                <li>Situaciones de fuerza mayor</li>
              </ul>
              <p className="text-[var(--ink-700)]">
                Te notificaremos si tu pedido se ve afectado por estas situaciones.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">9. Contacto</h2>
              <p className="text-[var(--ink-700)]">
                Para consultas sobre tu envío:<br />
                <strong>Email:</strong> envios@doflins.dofer.mx (actualiza con tu correo real)<br />
                <strong>WhatsApp:</strong> [Tu número] (horario de atención)
              </p>
            </section>

            <div className="mt-8 rounded-lg border-2 border-[#d8ca9e] bg-[#fff9e8] p-4">
              <p className="text-sm text-[var(--ink-700)]">
                <strong>💡 Consejo:</strong> Asegúrate de proporcionar un número de teléfono de contacto 
                válido. La paquetería puede necesitar comunicarse contigo para coordinar la entrega.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/faq">Ver Preguntas Frecuentes</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/terminos">Términos y Condiciones</Link>
          </Button>
        </div>
      </main>
      <BottomNav />
    </>
  );
}

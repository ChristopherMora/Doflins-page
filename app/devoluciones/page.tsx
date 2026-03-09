import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon, ArrowPathIcon, XCircleIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

import { BottomNav } from "@/components/nav/bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Devoluciones y Reembolsos",
  description: "Política de devoluciones, cambios y reembolsos de DOFLINS. Conoce tus derechos como consumidor.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function DevolucionesPage(): React.JSX.Element {
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
            <ArrowPathIcon className="h-5 w-5" />
            Devoluciones y Reembolsos
          </div>
          <h1 className="font-title text-4xl text-[var(--ink-900)] sm:text-5xl">
            Política de Devoluciones
          </h1>
          <p className="text-lg text-[var(--ink-700)]">
            Tu satisfacción es importante, conoce nuestras políticas de devolución
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-start gap-3 p-4">
              <CheckCircleIcon className="h-6 w-6 shrink-0 text-green-600" />
              <div>
                <h3 className="font-semibold text-[var(--ink-900)]">Sí aceptamos devolución</h3>
                <ul className="mt-1 space-y-1 text-sm text-[var(--ink-700)]">
                  <li>• Producto defectuoso o dañado</li>
                  <li>• Error en tu pedido</li>
                  <li>• Pack sin abrir (sellado)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-start gap-3 p-4">
              <XCircleIcon className="h-6 w-6 shrink-0 text-red-600" />
              <div>
                <h3 className="font-semibold text-[var(--ink-900)]">No aceptamos devolución</h3>
                <ul className="mt-1 space-y-1 text-sm text-[var(--ink-700)]">
                  <li>• Pack abierto o usado</li>
                  <li>• Rareza no deseada</li>
                  <li>• Figuras duplicadas</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 border-2 border-[#d8ca9e] bg-[#fff9e8]">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <ExclamationCircleIcon className="h-6 w-6 shrink-0 text-[#c4971f]" />
              <div>
                <h3 className="font-semibold text-[var(--ink-900)]">Importante: Packs Sorpresa</h3>
                <p className="mt-1 text-sm text-[var(--ink-700)]">
                  Los <strong>packs sorpresa</strong> contienen figuras de <strong>rareza aleatoria</strong>. 
                  Una vez abierto el pack, <strong>no se aceptan devoluciones</strong> por rareza obtenida, 
                  duplicados o preferencias personales. Al comprar aceptas la naturaleza aleatoria del producto.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#d3debb] bg-gradient-to-br from-white to-[#f9faf5]">
          <CardContent className="prose prose-sm max-w-none space-y-6 p-6 sm:p-8">
            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">1. Derecho de devolución</h2>
              <p className="text-[var(--ink-700)]">
                Conforme a la <strong>Ley Federal de Protección al Consumidor</strong>, tienes derecho 
                a devolver productos defectuosos, dañados o que no cumplan con lo ofrecido.
              </p>
              <p className="text-[var(--ink-700)]">
                <strong>Plazo:</strong> Tienes hasta <strong>7 días naturales</strong> después de recibir 
                tu pedido para solicitar una devolución válida.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">2. Casos en los que SÍ aceptamos devoluciones</h2>
              
              <div className="not-prose space-y-3">
                <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
                  <h3 className="flex items-center gap-2 font-semibold text-[var(--ink-900)]">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    Producto defectuoso o dañado
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-700)]">
                    Si tu figura llega con defectos de fabricación, roturas, pintura dañada o 
                    cualquier problema de calidad.
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-700)]">
                    <strong>Requisito:</strong> Toma fotos claras del daño antes de manipular el producto.
                  </p>
                </div>

                <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
                  <h3 className="flex items-center gap-2 font-semibold text-[var(--ink-900)]">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    Error en el pedido
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-700)]">
                    Si recibiste un producto diferente al que ordenaste (error de empaque de nuestra parte).
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-700)]">
                    <strong>Solución:</strong> Te enviamos el producto correcto sin costo adicional.
                  </p>
                </div>

                <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
                  <h3 className="flex items-center gap-2 font-semibold text-[var(--ink-900)]">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    Pack sin abrir (sellado de fábrica)
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-700)]">
                    Si el pack sorpresa o figura individual <strong>nunca fue abierto</strong> y conserva 
                    el sellado original intacto.
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-700)]">
                    <strong>Requisito:</strong> Empaque original sin daños, etiquetas intactas.
                  </p>
                </div>

                <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
                  <h3 className="flex items-center gap-2 font-semibold text-[var(--ink-900)]">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    Daños durante el envío
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-700)]">
                    Si el paquete llega dañado y el contenido presenta roturas o daños visibles.
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-700)]">
                    <strong>Requisito:</strong> Fotos del paquete dañado antes de abrirlo completamente.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">3. Casos en los que NO aceptamos devoluciones</h2>
              
              <div className="not-prose space-y-3">
                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
                  <h3 className="flex items-center gap-2 font-semibold text-[var(--ink-900)]">
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                    Pack abierto - Rareza aleatoria
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-700)]">
                    Una vez que abres un pack sorpresa, <strong>no puedes devolverlo</strong> por:
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-[var(--ink-700)]">
                    <li>Obtener una rareza común en lugar de épica/legendaria</li>
                    <li>No obtener el personaje que esperabas</li>
                    <li>Obtener figuras duplicadas</li>
                    <li>No gustarte el diseño o colores</li>
                  </ul>
                  <p className="mt-2 text-xs font-semibold text-red-800">
                    Los packs sorpresa son productos de rareza aleatoria por naturaleza.
                  </p>
                </div>

                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
                  <h3 className="flex items-center gap-2 font-semibold text-[var(--ink-900)]">
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                    Cambio de opinión
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-700)]">
                    Si ya usaste o abriste el producto y simplemente cambiaste de opinión.
                  </p>
                </div>

                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
                  <h3 className="flex items-center gap-2 font-semibold text-[var(--ink-900)]">
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                    Daños por mal uso
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-700)]">
                    Daños causados por ti después de recibir el producto (caídas, exposición al sol, 
                    manipulación incorrecta).
                  </p>
                </div>

                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
                  <h3 className="flex items-center gap-2 font-semibold text-[var(--ink-900)]">
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                    Producto incompleto
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-700)]">
                    Si el producto no incluye todos los componentes originales (empaque, bases, accesorios).
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">4. Proceso de devolución</h2>
              
              <div className="not-prose space-y-3">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4e6f2a] font-bold text-white">1</div>
                  <div>
                    <h3 className="font-semibold text-[var(--ink-900)]">Contacta con nosotros</h3>
                    <p className="text-sm text-[var(--ink-700)]">
                      Envía un email a{" "}
                      <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contacto@doflins.com"}`} className="font-semibold underline">{process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contacto@doflins.com"}</a>{" "}
                      dentro de los primeros 7 días naturales después de recibir tu pedido.
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-700)]">
                      Incluye: Número de pedido, descripción del problema, fotos claras.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4e6f2a] font-bold text-white">2</div>
                  <div>
                    <h3 className="font-semibold text-[var(--ink-900)]">Evaluación</h3>
                    <p className="text-sm text-[var(--ink-700)]">
                      Nuestro equipo revisará tu caso en menos de 24-48 horas hábiles y te informará 
                      si tu devolución es aprobada.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4e6f2a] font-bold text-white">3</div>
                  <div>
                    <h3 className="font-semibold text-[var(--ink-900)]">Autorización y guía</h3>
                    <p className="text-sm text-[var(--ink-700)]">
                      Si se aprueba, recibirás instrucciones para devolver el producto. En algunos casos, 
                      te enviaremos una guía prepagada de paquetería.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4e6f2a] font-bold text-white">4</div>
                  <div>
                    <h3 className="font-semibold text-[var(--ink-900)]">Envío de devolución</h3>
                    <p className="text-sm text-[var(--ink-700)]">
                      Empaca el producto de forma segura y envíalo. Conserva el comprobante de envío.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4e6f2a] font-bold text-white">5</div>
                  <div>
                    <h3 className="font-semibold text-[var(--ink-900)]">Reembolso o reemplazo</h3>
                    <p className="text-sm text-[var(--ink-700)]">
                      Una vez recibido y validado el producto, procesamos tu reembolso o enviamos el reemplazo 
                      (según el caso).
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">5. Reembolsos</h2>
              
              <h3 className="font-semibold text-[var(--ink-900)]">Métodos de reembolso</h3>
              <p className="text-[var(--ink-700)]">Los reembolsos se procesan al mismo método de pago utilizado:</p>
              <ul className="list-disc pl-6 text-[var(--ink-700)]">
                <li><strong>Tarjeta de crédito/débito:</strong> 5-10 días hábiles (depende de tu banco)</li>
                <li><strong>PayPal:</strong> 3-5 días hábiles</li>
                <li><strong>Transferencia bancaria:</strong> 3-5 días hábiles</li>
              </ul>

              <h3 className="mt-4 font-semibold text-[var(--ink-900)]">Qué se reembolsa</h3>
              <ul className="list-disc pl-6 text-[var(--ink-700)]">
                <li>Precio del producto</li>
                <li>Impuestos pagados</li>
                <li>Costo de envío original (si el problema fue nuestro)</li>
              </ul>

              <h3 className="mt-4 font-semibold text-[var(--ink-900)]">Qué NO se reembolsa</h3>
              <ul className="list-disc pl-6 text-[var(--ink-700)]">
                <li>Costo de envío de devolución (excepto si el error fue nuestro)</li>
                <li>Costo de envío original si la devolución es por cambio de opinión en producto sellado</li>
              </ul>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">6. Cambios (intercambios)</h2>
              <p className="text-[var(--ink-700)]">
                Actualmente <strong>no ofrecemos cambios directos</strong> por otros productos. Si deseas un 
                producto diferente:
              </p>
              <ol className="list-decimal pl-6 text-[var(--ink-700)]">
                <li>Solicita la devolución del producto original (si califica)</li>
                <li>Recibe tu reembolso</li>
                <li>Realiza una nueva compra del producto deseado</li>
              </ol>
              <p className="mt-2 text-[var(--ink-700)]">
                <strong>Excepción:</strong> Si recibiste un producto equivocado por error nuestro, 
                te enviamos el correcto directamente sin que debas realizar una nueva compra.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">7. Garantía de calidad</h2>
              <p className="text-[var(--ink-700)]">
                Todas nuestras figuras están sujetas a controles de calidad antes del envío. Si aún así 
                recibes un producto defectuoso, lo reemplazamos sin costo o reembolsamos tu dinero.
              </p>
              <p className="text-[var(--ink-700)]">
                <strong>Cobertura de garantía:</strong> 30 días desde la fecha de recepción para defectos 
                de fabricación.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">8. Gastos de envío de devolución</h2>
              
              <div className="not-prose space-y-3">
                <div className="rounded-lg border border-[#d3debb] bg-white p-4">
                  <h3 className="font-semibold text-[var(--ink-900)]">🎁 Nosotros pagamos</h3>
                  <p className="text-sm text-[var(--ink-700)]">
                    Si el problema es de nuestra responsabilidad (defecto, error de empaque, daño en tránsito), 
                    <strong>cubrimos el costo del envío de devolución</strong>.
                  </p>
                </div>

                <div className="rounded-lg border border-[#d3debb] bg-white p-4">
                  <h3 className="font-semibold text-[var(--ink-900)]">💰 Tú pagas</h3>
                  <p className="text-sm text-[var(--ink-700)]">
                    Si es por cambio de opinión en un pack sellado sin abrir, 
                    <strong>tú cubres el costo del envío de devolución</strong>.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">9. Productos promocionales y descuentos</h2>
              <p className="text-[var(--ink-700)]">
                Los productos adquiridos con descuentos, promociones o cupones se reembolsan al precio 
                efectivamente pagado (precio con descuento aplicado), no al precio original.
              </p>
            </section>

            <section>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">10. Contacto para devoluciones</h2>
              <p className="text-[var(--ink-700)]">
                <strong>Email:</strong>{" "}
                <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contacto@doflins.com"}`} className="underline">
                  {process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contacto@doflins.com"}
                </a><br />
                {process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_URL ? (
                  <><strong>WhatsApp:</strong>{" "}<a href={process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="underline">Escribenos por WhatsApp</a><br /></>
                ) : null}
                <strong>Horario:</strong> Lunes a viernes, 9:00 AM - 6:00 PM (hora CDMX)
              </p>
            </section>

            <div className="mt-8 rounded-lg border-2 border-[#4e6f2a] bg-[#e6f2d0] p-4">
              <p className="text-sm text-[var(--ink-900)]">
                <strong>🛡️ Tus derechos como consumidor:</strong> Esta política se rige por la 
                <strong> Ley Federal de Protección al Consumidor de México</strong>. Tienes derecho 
                a presentar una queja ante PROFECO si consideras que tus derechos han sido vulnerados.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/terminos">Términos y Condiciones</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/envios">Política de Envíos</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/faq">Preguntas Frecuentes</Link>
          </Button>
        </div>
      </main>
      <BottomNav />
    </>
  );
}

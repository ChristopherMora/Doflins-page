import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import {
  QuestionMarkCircleIcon,
  TruckIcon,
  CreditCardIcon,
  SparklesIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/solid";

import { BottomNav } from "@/components/nav/bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes (FAQ)",
  description: "Encuentra respuestas sobre colección DOFLINS, sistema de rareza, envíos, pagos y más. Guía completa para coleccionistas de figuras Animals y Multiverse.",
  keywords: [
    "doflins faq",
    "preguntas frecuentes doflins",
    "cómo funciona rareza doflins",
    "envíos doflins",
    "colección animals multiverse",
  ],
  openGraph: {
    title: "Preguntas Frecuentes | DOFLINS",
    description: "Respuestas sobre colección, rareza, envíos y compras de figuras DOFLINS.",
  },
};

const faqs = [
  {
    icon: SparklesIcon,
    category: "Colección y Rareza",
    questions: [
      {
        q: "¿Qué son los DOFLINS?",
        a: "DOFLINS son figuras coleccionables de dos universos: Animals y Multiverse. Cada figura tiene un sistema oficial de rareza que puedes consultar en nuestro catálogo.",
      },
      {
        q: "¿Cómo funciona el sistema de rareza?",
        a: "Cada figura tiene una rareza asignada: Común, Rara, Épica o Legendaria. Puedes consultar todas las rarezas oficiales en nuestra página de catálogo.",
      },
      {
        q: "¿Cuántas figuras existen en total?",
        a: "La colección completa incluye decenas de personajes únicos distribuidos entre Animals y Multiverse. El catálogo se actualiza constantemente con nuevos lanzamientos.",
      },
      {
        q: "¿Puedo llevar registro de mi colección?",
        a: "Sí, accede a la sección 'Mi Colección' para marcar las figuras que tienes y ver tu progreso por rareza y universo.",
      },
    ],
  },
  {
    icon: CreditCardIcon,
    category: "Compras y Pagos",
    questions: [
      {
        q: "¿Cómo puedo comprar figuras DOFLINS?",
        a: "Compra packs en nuestra tienda oficial. Ofrecemos diferentes paquetes con figuras sorpresa de diferentes rarezas.",
      },
      {
        q: "¿Qué métodos de pago aceptan?",
        a: "Aceptamos tarjetas de crédito/débito, OXXO, SPEI y otros métodos locales a través de nuestra plataforma segura Shopify.",
      },
      {
        q: "¿Es seguro comprar en línea?",
        a: "Sí, todas las transacciones están protegidas por Shopify Payments, una de las plataformas de pago más seguras del mundo.",
      },
      {
        q: "¿Puedo cambiar o devolver un producto?",
        a: "Por la naturaleza de packs sorpresa, no aceptamos cambios ni devoluciones una vez abierto el paquete. Consulta nuestra política de devoluciones para más detalles.",
      },
    ],
  },
  {
    icon: TruckIcon,
    category: "Envíos",
    questions: [
      {
        q: "¿Hacen envíos a toda la República Mexicana?",
        a: "Sí, hacemos envíos a todo México. Los tiempos de entrega varían según tu ubicación.",
      },
      {
        q: "¿Cuánto tarda el envío?",
        a: "Los tiempos de envío son de 3-7 días hábiles para la mayoría de las ubicaciones en México. Recibirás un número de rastreo una vez que tu pedido sea enviado.",
      },
      {
        q: "¿Puedo rastrear mi pedido?",
        a: "Sí, recibirás un correo electrónico con el número de rastreo para seguir tu paquete en tiempo real.",
      },
      {
        q: "¿Cuál es el costo de envío?",
        a: "El costo de envío se calcula automáticamente al finalizar tu compra según tu código postal. Ofrecemos envío gratis en compras mayores a cierto monto.",
      },
    ],
  },
  {
    icon: QuestionMarkCircleIcon,
    category: "Otros",
    questions: [
      {
        q: "¿Necesito crear una cuenta para comprar?",
        a: "No es obligatorio, pero crear una cuenta te permite guardar tu colección, ver tu historial de pedidos y acceder a promociones exclusivas.",
      },
      {
        q: "¿Puedo regalar una figura DOFLINS?",
        a: "Sí, en el proceso de compra puedes agregar un mensaje de regalo y enviarlo directamente a la dirección del destinatario.",
      },
      {
        q: "¿Lanzan nuevas figuras regularmente?",
        a: "Sí, agregamos nuevos personajes y packs especiales periódicamente. Sigue nuestras redes sociales para enterarte de nuevos lanzamientos.",
      },
      {
        q: "¿Cómo puedo contactar soporte?",
        a: "Envíanos un correo o contáctanos por WhatsApp. Los enlaces están en el pie de página de nuestro sitio.",
      },
      {
        q: "¿Cómo verifico la autenticidad de mi figura?",
        a: "Las figuras oficiales DOFLINS vienen con un código único. Si tienes dudas sobre la autenticidad, contáctanos con fotos de tu figura.",
      },
    ],
  },
];

export default function FAQPage(): React.JSX.Element {
  // Structured data para FAQ
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.flatMap((category) =>
      category.questions.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      }))
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
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
            <QuestionMarkCircleIcon className="h-5 w-5" />
            Preguntas Frecuentes
          </div>
          <h1 className="font-title text-4xl text-[var(--ink-900)] sm:text-5xl">
            ¿Tienes dudas sobre DOFLINS?
          </h1>
          <p className="text-lg text-[var(--ink-700)]">
            Encuentra respuestas sobre nuestra colección, sistema de rareza, envíos y más.
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((category) => (
            <Card
              key={category.category}
              className="border-[#d3debb] bg-gradient-to-br from-white to-[#f9faf5]"
            >
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-[#e6f2d0] p-2">
                    <category.icon className="h-6 w-6 text-[#4e6f2a]" />
                  </div>
                  <h2 className="font-title text-2xl text-[var(--ink-900)]">{category.category}</h2>
                </div>

                <div className="space-y-5">
                  {category.questions.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <h3 className="font-semibold text-[var(--ink-900)]">{item.q}</h3>
                      <p className="text-sm leading-relaxed text-[var(--ink-700)]">{item.a}</p>
                      {idx < category.questions.length - 1 && (
                        <div className="mt-4 border-t border-[#e8f1d2]" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 border-[#d8ca9e] bg-[linear-gradient(135deg,#f5f8e8,#e8f1d2)]">
          <CardContent className="space-y-4 p-6 text-center">
            <GlobeAltIcon className="mx-auto h-12 w-12 text-[#4e6f2a]" />
            <h2 className="font-title text-2xl text-[var(--ink-900)]">¿No encontraste tu respuesta?</h2>
            <p className="text-[var(--ink-700)]">
              Contáctanos directamente y te ayudaremos con cualquier duda sobre DOFLINS.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild className="bg-[#4e6f2a]">
                <Link href="mailto:contacto@doflins.com">
                  Enviar correo
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/">
                  Ver catálogo
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <BottomNav />
    </>
  );
}

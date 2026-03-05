import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import {
  SparklesIcon,
  ShieldCheckIcon,
  HeartIcon,
  TrophyIcon,
  UserGroupIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/solid";

import { BottomNav } from "@/components/nav/bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Acerca de DOFLINS",
  description: "Descubre la historia detrás de DOFLINS, nuestra misión de crear la mejor colección de figuras con sistema de rareza oficial. Conoce los universos Animals y Multiverse.",
  keywords: [
    "acerca de doflins",
    "historia doflins",
    "quiénes somos",
    "colección mexicana",
    "figuras animals multiverse",
  ],
  openGraph: {
    title: "Acerca de DOFLINS | Nuestra Historia",
    description: "Descubre la historia detrás de DOFLINS y nuestra misión de crear la mejor colección de figuras con rareza verificada.",
  },
};

export default function AboutPage(): React.JSX.Element {
  const values = [
    {
      icon: ShieldCheckIcon,
      title: "Autenticidad",
      description: "Sistema de rareza oficial verificable en nuestro catálogo digital.",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: SparklesIcon,
      title: "Calidad",
      description: "Figuras diseñadas con atención al detalle y fabricadas con materiales de primera.",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      icon: HeartIcon,
      title: "Comunidad",
      description: "Construimos una comunidad de coleccionistas apasionados por DOFLINS.",
      color: "text-pink-600",
      bg: "bg-pink-50",
    },
    {
      icon: TrophyIcon,
      title: "Innovación",
      description: "Plataforma digital para llevar registro de tu colección y progreso.",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 pb-28 sm:px-8 sm:pb-12">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ChevronLeftIcon className="h-4 w-4" /> Volver al inicio
            </Link>
          </Button>
        </div>

        {/* Hero */}
        <div className="mb-10 space-y-4">
          <Badge className="bg-[#e6f2d0] text-[#1f2a1a]">
            <UserGroupIcon className="h-4 w-4" /> Acerca de Nosotros
          </Badge>
          <h1 className="font-title text-4xl leading-tight text-[#1f2a1a] sm:text-6xl">
            Bienvenido al universo <span className="text-[#4e6f2a]">DOFLINS</span>
          </h1>
          <p className="text-xl text-[#3d5230]">
            Creamos experiencias de colección únicas con rareza verificada y tecnología QR.
          </p>
        </div>

        {/* Nuestra Historia */}
        <Card className="mb-8 border-[#d3debb] bg-gradient-to-br from-white to-[#f9faf5]">
          <CardContent className="space-y-5 p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#e6f2d0] p-2">
                <SparklesIcon className="h-6 w-6 text-[#4e6f2a]" />
              </div>
              <h2 className="font-title text-3xl text-[#1f2a1a]">Nuestra Historia</h2>
            </div>
            
            <div className="space-y-4 text-[#3d5230]">
              <p className="leading-relaxed">
                DOFLINS es creado por <strong>DOFER</strong>, una marca mexicana dedicada al diseño y
                fabricación de productos innovadores. Nuestro proyecto nació de la pasión por crear
                figuras coleccionables que combinaran calidad, diseño único y un sistema de rareza
                auténtico y verificable. Queríamos llevar la experiencia de coleccionar al siguiente nivel.
              </p>
              <p className="leading-relaxed">
                Con dos universos únicos — <strong>Animals</strong> y <strong>Multiverse</strong> — cada
                figura cuenta su propia historia. Desde criaturas del mundo natural hasta personajes de
                dimensiones alternativas, DOFLINS ofrece diversidad y sorpresa en cada pack.
              </p>
              <p className="leading-relaxed">
                Lo que nos hace diferentes es nuestro compromiso con la autenticidad: cada figura tiene
                su rareza oficial (Común, Rara, Épica o Legendaria) verificable en nuestro catálogo
                digital, garantizando transparencia total.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Nuestros Valores */}
        <div className="mb-8">
          <h2 className="mb-6 font-title text-3xl text-[#1f2a1a]">Nuestros Valores</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {values.map((value) => (
              <Card
                key={value.title}
                className="border-[#d3debb] bg-white transition-transform hover:-translate-y-1"
              >
                <CardContent className="space-y-3 p-6">
                  <div className={`inline-flex rounded-lg ${value.bg} p-3`}>
                    <value.icon className={`h-7 w-7 ${value.color}`} />
                  </div>
                  <h3 className="font-title text-xl text-[#1f2a1a]">{value.title}</h3>
                  <p className="text-sm leading-relaxed text-[#3d5230]">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Los Universos */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <Card className="border-[#d8ca9e] bg-[linear-gradient(180deg,#fff9e8,#f3f6e4)]">
            <CardContent className="space-y-4 p-6">
              <Badge className="bg-[#e6f2d0] text-[#1f2a1a]">Universo Animals</Badge>
              <h3 className="font-title text-2xl text-[#1f2a1a]">Animals</h3>
              <p className="text-sm leading-relaxed text-[#3d5230]">
                Criaturas inspiradas en la naturaleza con diseños únicos. Desde animales terrestres hasta
                marinos, cada figura captura la esencia y personalidad del reino animal.
              </p>
              <Button asChild variant="secondary" size="sm" className="w-full">
                <Link href="/reveal?universe=animals">
                  Explorar Animals
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[#d8ca9e] bg-[linear-gradient(180deg,#f3f6fb,#f8f4f6)]">
            <CardContent className="space-y-4 p-6">
              <Badge className="bg-purple-100 text-purple-900">Universo Multiverse</Badge>
              <h3 className="font-title text-2xl text-[#1f2a1a]">Multiverse</h3>
              <p className="text-sm leading-relaxed text-[#3d5230]">
                Personajes de dimensiones alternativas con poderes y estéticas únicas. Un universo de
                posibilidades infinitas donde la imaginación no tiene límites.
              </p>
              <Button asChild variant="secondary" size="sm" className="w-full">
                <Link href="/reveal?universe=multiverse">
                  Explorar Multiverse
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Nuestra Misión */}
        <Card className="border-[#d3debb] bg-[linear-gradient(135deg,#f5f8e8,#e8f1d2)]">
          <CardContent className="space-y-5 p-8 text-center">
            <GlobeAltIcon className="mx-auto h-14 w-14 text-[#4e6f2a]" />
            <h2 className="font-title text-3xl text-[#1f2a1a]">Nuestra Misión</h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[#3d5230]">
              Crear la mejor experiencia de colección de figuras en México, combinando calidad, diseño
              único, tecnología y una comunidad apasionada. Cada DOFLIN es una pieza de arte
              coleccionable con historia propia.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-3">
              <Button asChild className="bg-[#4e6f2a]">
                <Link href="/#compras">
                  Ver packs disponibles
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/reveal">
                  Explorar catálogo
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contacto */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#3d5230]">
            ¿Preguntas o sugerencias?{" "}
            <Link href="/faq" className="font-semibold text-[#4e6f2a] hover:underline">
              Consulta nuestro FAQ
            </Link>{" "}
            o contáctanos directamente.
          </p>
        </div>
      </main>
      <BottomNav />
    </>
  );
}

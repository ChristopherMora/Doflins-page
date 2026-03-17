import type { Metadata } from "next";
import Link from "next/link";
import {
  TrophyIcon,
  SparklesIcon,
  ShoppingBagIcon,
  GiftIcon,
  BookOpenIcon,
  StarIcon,
} from "@heroicons/react/24/solid";

import { BottomNav } from "@/components/nav/bottom-nav";
import { NicknameEditor } from "@/components/collection/nickname-editor";
import { ReferralCard } from "@/components/ui/referral-card";
import { AcquisitionHistory } from "@/components/perfil/acquisition-history";
import { PointsBalanceBadge } from "@/components/rewards/points-balance-badge";

export const metadata: Metadata = {
  title: "Mi Perfil · DOFLINS",
  description: "Gestiona tu nombre en el ranking, código de referido, colección y pedidos.",
  robots: { index: false },
};

const LINKS = [
  {
    href: "/coleccion",
    icon: SparklesIcon,
    label: "Mi Colección",
    desc: "Registra las figuras que tienes",
    color: "bg-[#eaf5d8] text-[#4e6f2a]",
  },
  {
    href: "/recompensas",
    icon: StarIcon,
    label: "Tienda de Puntos",
    desc: "Canjea tus puntos por recompensas",
    color: "bg-[#fffbe6] text-[#8a6200]",
  },
  {
    href: "/ranking",
    icon: TrophyIcon,
    label: "Ranking",
    desc: "Ve tu posición entre coleccionistas",
    color: "bg-[#fffbe6] text-[#b8860b]",
  },
  {
    href: "/mis-pedidos",
    icon: ShoppingBagIcon,
    label: "Mis Pedidos",
    desc: "Historial de compras en la tienda",
    color: "bg-[#e8f0fe] text-[#3b5bdb]",
  },
  {
    href: "/mi-codigo",
    icon: GiftIcon,
    label: "Código de Referido",
    desc: "Comparte y gana descuentos",
    color: "bg-[#fde8f5] text-[#9b1fae]",
  },
  {
    href: "/reveal",
    icon: BookOpenIcon,
    label: "Revelar Pack",
    desc: "Escanea el código de tu bolsa física",
    color: "bg-[#e8faf0] text-[#1a7a4a]",
  },
];

export default function PerfilPage(): React.JSX.Element {
  return (
    <>
      <main className="mx-auto w-full max-w-2xl px-4 py-8 pb-28 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-title text-2xl font-black text-[var(--ink-900)]">Mi Perfil</h1>
          <p className="mt-1 text-sm text-[var(--ink-400)]">
            Tu espacio en la comunidad DOFLINS
          </p>
        </div>

        {/* Nickname editor */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--ink-400)]">
            Nombre en el ranking
          </h2>
          <NicknameEditor />
        </section>

        {/* Balance de puntos */}
        <section className="mb-6">
          <PointsBalanceBadge />
        </section>

        {/* Accesos rápidos */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--ink-400)]">
            Accesos rápidos
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {LINKS.map(({ href, icon: Icon, label, desc, color }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-2xl border border-[var(--surface-200)] bg-[var(--background)] p-4 transition hover:border-[var(--surface-300)] hover:shadow-sm"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-sm text-[var(--ink-900)]">{label}</p>
                  <p className="text-xs text-[var(--ink-400)]">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Código de referido inline */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--ink-400)]">
            Tu código de referido
          </h2>
          <ReferralCard />
        </section>

        {/* Historial de adquisiciones */}
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--ink-400)]">
            Últimas figuras obtenidas
          </h2>
          <AcquisitionHistory />
        </section>
      </main>

      <BottomNav />
    </>
  );
}

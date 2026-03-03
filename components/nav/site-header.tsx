import Link from "next/link";
import { GlobeAltIcon, RectangleStackIcon, ShoppingCartIcon, SparklesIcon } from "@heroicons/react/24/solid";

import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";

export function SiteHeader(): React.JSX.Element {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#d3debb]/60 bg-[#f6f2df]/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-1 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          aria-label="Inicio DOFLINS"
        >
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[linear-gradient(135deg,#425f2d,#6f8740)] text-xs font-black text-white select-none">
            DF
          </div>
          <span className="font-title text-xl font-extrabold tracking-tight text-[var(--ink-900)]">
            DOFLINS
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-6 text-sm font-semibold text-[var(--ink-700)] sm:flex"
          aria-label="Navegación principal"
        >
          <Link
            href="/reveal?universe=animals"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            <SparklesIcon className="h-4 w-4" />
            Catálogo
          </Link>
          <a
            href="#compras"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            <ShoppingCartIcon className="h-4 w-4" />
            Tienda
          </a>
          <Link
            href="/coleccion"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            <RectangleStackIcon className="h-4 w-4" />
            Colección
          </Link>
        </nav>

        {/* Dark mode + CTA */}
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          <a
            href="#compras"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(78,111,42,0.35)] transition hover:brightness-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
          >
            <GlobeAltIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Comprar packs</span>
            <span className="sm:hidden">Packs</span>
          </a>
        </div>
      </div>
    </header>
  );
}

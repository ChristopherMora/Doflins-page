"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, RectangleStackIcon, Squares2X2Icon, UserCircleIcon } from "@heroicons/react/24/solid";

import { MOBILE_NAV_ITEMS } from "@/lib/constants/nav";

const ICON_MAP: Record<string, React.ElementType> = {
  "Inicio": HomeIcon,
  "Catálogo": Squares2X2Icon,
  "Colección": RectangleStackIcon,
  "Perfil": UserCircleIcon,
};

export function BottomNav(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--surface-200)] bg-[var(--background)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
      aria-label="Navegación inferior"
    >
      <div className="flex items-center justify-around py-1.5">
        {MOBILE_NAV_ITEMS.map(({ href, label }) => {
          const Icon = ICON_MAP[label] ?? Squares2X2Icon;
          const isActive = label === "Inicio" ? pathname === "/" : pathname === href.split("?")[0];

          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-0.5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition active:scale-95"
            >
              {isActive && (
                <span className="absolute inset-x-1 top-0.5 bottom-1 rounded-full bg-[var(--brand-primary)]/10" />
              )}
              <Icon className={`relative h-5 w-5 transition-transform ${isActive ? "scale-110 text-[var(--brand-primary)]" : "text-[var(--ink-600)]"}`} />
              <span className={`relative ${isActive ? "text-[var(--brand-primary)]" : "text-[var(--ink-600)]"}`}>{label}</span>
              {isActive && (
                <span className="nav-active-dot absolute -bottom-px left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-[var(--brand-primary)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

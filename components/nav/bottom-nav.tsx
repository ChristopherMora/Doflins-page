"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, RectangleStackIcon, ShoppingCartIcon, Squares2X2Icon } from "@heroicons/react/24/solid";

interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  isAnchor?: boolean;
}

const NAV_ITEMS: BottomNavItem[] = [
  { href: "/", label: "Inicio", icon: HomeIcon },
  { href: "/reveal?universe=animals", label: "Catálogo", icon: Squares2X2Icon },
  { href: "#compras", label: "Tienda", icon: ShoppingCartIcon, isAnchor: true },
  { href: "/coleccion", label: "Colección", icon: RectangleStackIcon },
];

export function BottomNav(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--surface-200)] bg-[var(--background)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
      aria-label="Navegación inferior"
    >
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, isAnchor }) => {
          const isActive = !isAnchor && pathname === href.split("?")[0];

          if (isAnchor) {
            return (
              <a
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ink-600)] transition active:scale-95"
              >
                <Icon className="h-5 w-5" />
                {label}
              </a>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition active:scale-95 ${
                isActive
                  ? "text-[var(--brand-primary)]"
                  : "text-[var(--ink-600)] hover:text-[var(--ink-900)]"
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : ""}`} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Fuente única de verdad para los ítems de navegación.
 * Tanto site-header como bottom-nav consumen estas listas.
 */

export interface NavItem {
  href: string;
  label: string;
  isAnchor?: boolean;
}

/** Ítems del nav de escritorio (sin íconos — site-header los asigna) */
export const DESKTOP_NAV_ITEMS: NavItem[] = [
  { href: "/reveal?universe=animals", label: "Catálogo" },
  { href: "/#compras", label: "Tienda", isAnchor: true },
  { href: "/coleccion", label: "Colección" },
  { href: "/recompensas", label: "Recompensas" },
];

/** Ítems del bottom nav móvil (sin "Inicio" — el logo lo cubre en header) */
export const MOBILE_NAV_ITEMS: NavItem[] = [
  { href: "/reveal?universe=animals", label: "Catálogo" },
  { href: "/#compras", label: "Tienda", isAnchor: true },
  { href: "/coleccion", label: "Colección" },
  { href: "/recompensas", label: "Recompensas" },
  { href: "/perfil", label: "Perfil" },
];

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
  { href: "/shop", label: "Tienda" },
  { href: "/reveal?universe=animals", label: "Catálogo" },
  { href: "/coleccion", label: "Colección" },
];

/** Ítems del bottom nav móvil */
export const MOBILE_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio" },
  { href: "/shop", label: "Tienda" },
  { href: "/coleccion", label: "Colección" },
  { href: "/perfil", label: "Perfil" },
];

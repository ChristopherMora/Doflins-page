"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRightStartOnRectangleIcon,
  GiftIcon,
  GlobeAltIcon,
  RectangleStackIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  Squares2X2Icon,
  TrophyIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";

import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getStoredUniverse, onUniverseChange, type Universe } from "@/lib/universe-store";
import { CART_SNAPSHOT_STORAGE_KEY } from "@/lib/constants/shop";
import { DESKTOP_NAV_ITEMS } from "@/lib/constants/nav";

function useDarkMode(): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.dataset.theme === "dark");
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export function SiteHeader(): React.JSX.Element {
  const [universe, setUniverse] = useState<Universe>("neutral");
  const dark = useDarkMode();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Ocultar header al bajar, mostrar al subir
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const diff = y - lastScrollY.current;
      if (Math.abs(diff) < 6) return;
      setHeaderHidden(diff > 0 && y > 100);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUniverse(getStoredUniverse());
    }, 0);
    const unsubscribe = onUniverseChange(setUniverse);
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const readCartCount = () => {
      try {
        const raw = localStorage.getItem(CART_SNAPSHOT_STORAGE_KEY);
        if (!raw) { setCartCount(0); return; }
        const parsed = JSON.parse(raw) as { lines?: { quantity: number }[] };
        const count = Array.isArray(parsed.lines)
          ? parsed.lines.reduce((s, l) => s + (Number(l?.quantity) || 0), 0)
          : 0;
        setCartCount(count);
      } catch { setCartCount(0); }
    };
    readCartCount();
    window.addEventListener("doflins:cart-updated", readCartCount);
    window.addEventListener("storage", readCartCount);
    return () => {
      window.removeEventListener("doflins:cart-updated", readCartCount);
      window.removeEventListener("storage", readCartCount);
    };
  }, []);

  useEffect(() => {
    void fetch("/api/auth/admin-status")
      .then((r) => r.json())
      .then((d: { isAdmin?: boolean; isAuthenticated?: boolean; userEmail?: string | null }) => {
        if (d.isAdmin) setIsAdmin(true);
        if (d.isAuthenticated) setUserEmail(d.userEmail ?? null);
      })
      .catch(() => {});
  }, []);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUserEmail(null);
    setIsAdmin(false);
    setMenuOpen(false);
    window.location.href = "/";
  };

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : null;

  const isMultiverse = universe === "multiverse";
  const isAnimals = universe === "animals";
  const isMega = universe === "mega";

  const headerBg = isMultiverse
    ? dark ? "rgba(10, 14, 36, 0.92)" : "rgba(238, 243, 255, 0.92)"
    : isMega
      ? dark ? "rgba(30, 20, 8, 0.92)" : "rgba(255, 251, 240, 0.92)"
      : isAnimals
        ? dark ? "rgba(12, 22, 14, 0.92)" : "rgba(242, 250, 238, 0.92)"
        : dark ? "rgba(14, 20, 16, 0.92)" : "rgba(244, 250, 240, 0.92)";

  const headerBorder = isMultiverse
    ? dark ? "rgba(44, 61, 104, 0.82)" : "rgba(197, 208, 255, 0.8)"
    : isMega
      ? dark ? "rgba(120, 80, 20, 0.8)" : "rgba(232, 204, 144, 0.8)"
      : isAnimals
        ? dark ? "rgba(50, 90, 50, 0.8)" : "rgba(176, 212, 160, 0.8)"
        : dark ? "rgba(50, 85, 55, 0.72)" : "rgba(180, 210, 164, 0.78)";

  const navColor = isMultiverse
    ? dark ? "#bfcdff" : "#2d3f8a"
    : isMega
      ? dark ? "#f0d888" : "#7a4e14"
      : isAnimals
        ? dark ? "#c8e8c0" : "#2a4a22"
        : dark ? "#c4e0bc" : "#2a4a22";

  const hoverBg = isMultiverse
    ? dark ? "rgba(97, 122, 232, 0.28)" : "rgba(75, 95, 192, 0.1)"
    : isMega
      ? dark ? "rgba(196, 124, 32, 0.26)" : "rgba(196, 124, 32, 0.1)"
      : isAnimals
        ? dark ? "rgba(70, 140, 60, 0.24)" : "rgba(60, 120, 40, 0.1)"
        : dark ? "rgba(70, 140, 60, 0.22)" : "rgba(60, 120, 40, 0.08)";
  const hoverColor = isMultiverse
    ? dark ? "#f0f4ff" : "#3950ba"
    : isMega
      ? dark ? "#ffe8a0" : "#a06020"
      : isAnimals
        ? dark ? "#d8f0d0" : "#1f4018"
        : dark ? "#d4ecc8" : "#1f4018";

  const ctaGradient = isMultiverse
    ? dark ? "linear-gradient(135deg,#5a73e0,#86a4ff)" : "linear-gradient(135deg,#4b5fc0,#687ff1)"
    : isMega
      ? dark ? "linear-gradient(135deg,#c47c20,#e8a830)" : "linear-gradient(135deg,#b87018,#d89828)"
      : isAnimals
        ? dark ? "linear-gradient(135deg,#3a8a28,#58a840)" : "linear-gradient(135deg,#3a7a28,#58a040)"
        : dark ? "linear-gradient(135deg,#348a24,#4ea038)" : "linear-gradient(135deg,#3a7a28,#58a040)";
  const ctaShadow = isMultiverse
    ? dark ? "0 8px 20px rgba(70,95,206,0.38)" : "0 4px 14px rgba(75,95,192,0.35)"
    : isMega
      ? dark ? "0 8px 20px rgba(196,124,32,0.38)" : "0 4px 14px rgba(196,124,32,0.35)"
      : isAnimals
        ? dark ? "0 8px 20px rgba(50,120,40,0.34)" : "0 4px 14px rgba(50,120,40,0.30)"
        : dark ? "0 8px 20px rgba(50,120,40,0.30)" : "0 4px 14px rgba(50,120,40,0.25)";

  const NAV_ICON_MAP: Record<string, React.ElementType> = {
    "Catálogo": Squares2X2Icon,
    "Colección": RectangleStackIcon,
  };
  const navLinks = DESKTOP_NAV_ITEMS.map((item) => ({
    ...item,
    Icon: NAV_ICON_MAP[item.label] ?? Squares2X2Icon,
  }));

  const linkHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      (e.currentTarget as HTMLElement).style.backgroundColor = hoverBg;
      (e.currentTarget as HTMLElement).style.color = hoverColor;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      (e.currentTarget as HTMLElement).style.backgroundColor = "";
      (e.currentTarget as HTMLElement).style.color = navColor;
    },
  };

  return (
    <motion.header
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: headerHidden ? "-100%" : 0, opacity: headerHidden ? 0 : 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors duration-300"
      style={{ background: headerBg, borderColor: headerBorder }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-1 py-1 transition focus-visible:outline-none focus-visible:ring-2"
          style={{ ["--tw-ring-color" as string]: hoverColor }}
          aria-label="Inicio DOFLINS"
        >
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black text-white select-none transition-all duration-300"
            style={{ background: ctaGradient }}
          >
            DF
          </div>
          <span
            className="font-title text-xl font-extrabold tracking-tight transition-colors duration-300"
            style={{ color: navColor }}
          >
            DOFLINS
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 text-sm font-semibold md:flex" aria-label="Navegación principal">
          {navLinks.map(({ href, Icon, label, isAnchor }) => {
            const cls = "flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2";
            const style: React.CSSProperties = { color: navColor };
            return isAnchor ? (
              <a key={label} href={href} className={cls} style={style} {...linkHandlers}>
                <Icon className="h-4 w-4" />{label}
              </a>
            ) : (
              <Link key={label} href={href} className={cls} style={style} {...linkHandlers}>
                <Icon className="h-4 w-4" />{label}
              </Link>
            );
          })}
        </nav>

        {/* Dark mode + CTA */}
        <div className="flex items-center gap-2">
          <DarkModeToggle />

          {/* Botón admin */}
          {isAdmin ? (
            <Link
              href="/admin/doflins"
              className="hidden md:inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-amber-600"
            >
              <ShieldCheckIcon className="h-4 w-4" />
              Admin
            </Link>
          ) : null}

          {/* Avatar de usuario con menú */}
          {userEmail ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black text-white transition-all duration-300 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
                style={{ background: ctaGradient, boxShadow: ctaShadow }}
                title={userEmail}
                aria-label="Menú de usuario"
              >
                {initials}
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-[#d8d2b4] bg-white shadow-xl" style={{ background: dark ? "#1a2010" : "white", borderColor: dark ? "#3a4a28" : "#d8d2b4" }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: dark ? "#3a4a28" : "#eee" }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: dark ? "#9ab870" : "#7a9050" }}>Sesión activa</p>
                    <p className="mt-0.5 truncate text-sm font-semibold" style={{ color: dark ? "#e0edcc" : "#1a2a0a" }}>{userEmail}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/perfil"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-[#f0f8e0]"
                      style={{ color: dark ? "#c8e0a8" : "#3a5a18" }}
                    >
                      <UserCircleIcon className="h-4 w-4 shrink-0" />
                      Mi Perfil
                    </Link>
                    <Link
                      href="/recompensas"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-[#f0f8e0]"
                      style={{ color: dark ? "#c8e0a8" : "#3a5a18" }}
                    >
                      <GiftIcon className="h-4 w-4 shrink-0" />
                      Recompensas
                    </Link>
                    <Link
                      href="/coleccion"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-[#f0f8e0]"
                      style={{ color: dark ? "#c8e0a8" : "#3a5a18" }}
                    >
                      <UserCircleIcon className="h-4 w-4 shrink-0" />
                      Mi Colección
                    </Link>
                    <Link
                      href="/mis-pedidos"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-[#f0f8e0]"
                      style={{ color: dark ? "#c8e0a8" : "#3a5a18" }}
                    >
                      <ShoppingBagIcon className="h-4 w-4 shrink-0" />
                      Mis pedidos
                    </Link>
                    <Link
                      href="/mi-codigo"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-[#f0f8e0]"
                      style={{ color: dark ? "#c8e0a8" : "#3a5a18" }}
                    >
                      <GiftIcon className="h-4 w-4 shrink-0" />
                      Código referido
                    </Link>
                    <Link
                      href="/ranking"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-[#f0f8e0]"
                      style={{ color: dark ? "#c8e0a8" : "#3a5a18" }}
                    >
                      <TrophyIcon className="h-4 w-4 shrink-0" />
                      Ranking
                    </Link>
                    <button
                      onClick={() => void handleSignOut()}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-red-50"
                      style={{ color: dark ? "#f08080" : "#b83030" }}
                    >
                      <ArrowRightStartOnRectangleIcon className="h-4 w-4 shrink-0" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Botón de login cuando no hay sesión */}
          {!userEmail ? (
            <Link
              href="/coleccion"
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-all duration-300 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
              style={{ color: navColor, borderColor: `${navColor}55` }}
            >
              <UserCircleIcon className="h-4 w-4" />
              Entrar
            </Link>
          ) : null}

          {/* Badge contador de carrito */}
          {cartCount > 0 ? (
            <CartIconButton cartCount={cartCount} navColor={navColor} />
          ) : null}

          <Link
            href="/#compras"
            className="hidden xl:inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: ctaGradient, boxShadow: ctaShadow }}
          >
            <GlobeAltIcon className="h-4 w-4" />
            Comprar packs
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

function CartIconButton({ cartCount, navColor }: { cartCount: number; navColor: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = () => {
    if (pathname === "/") {
      window.dispatchEvent(new CustomEvent("doflins:open-cart"));
    } else {
      router.push("/?openCart=1");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 hover:brightness-110 active:scale-95"
      style={{ color: navColor, borderColor: `${navColor}55` }}
      title={`${cartCount} item${cartCount !== 1 ? "s" : ""} en el carrito`}
      aria-label={`Carrito: ${cartCount} item${cartCount !== 1 ? "s" : ""}`}
    >
      <ShoppingCartIcon className="h-4 w-4" />
      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white leading-none">
        {cartCount > 9 ? "9+" : cartCount}
      </span>
    </button>
  );
}

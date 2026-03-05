"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  GlobeAltIcon,
  HomeIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  RectangleStackIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";

import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { getStoredUniverse, onUniverseChange, type Universe } from "@/lib/universe-store";

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
    void fetch("/api/auth/admin-status")
      .then((r) => r.json())
      .then((d: { isAdmin?: boolean }) => { if (d.isAdmin) setIsAdmin(true); })
      .catch(() => {});
  }, []);

  const isMultiverse = universe === "multiverse";
  const isAnimals = universe === "animals";

  const headerBg = isMultiverse
    ? dark ? "rgba(10, 14, 36, 0.92)" : "rgba(238, 243, 255, 0.92)"
    : isAnimals
      ? dark ? "rgba(17, 27, 14, 0.92)" : "rgba(249, 247, 237, 0.92)"
      : dark ? "rgba(10, 18, 30, 0.92)" : "rgba(250, 247, 240, 0.92)";

  const headerBorder = isMultiverse
    ? dark ? "rgba(44, 61, 104, 0.82)" : "rgba(197, 208, 255, 0.8)"
    : isAnimals
      ? dark ? "rgba(58, 89, 36, 0.8)" : "rgba(211, 222, 187, 0.8)"
      : dark ? "rgba(77, 103, 141, 0.72)" : "rgba(218, 208, 190, 0.82)";

  const navColor = isMultiverse
    ? dark ? "#bfcdff" : "#2d3f8a"
    : isAnimals
      ? dark ? "#d5e8ba" : "#445538"
      : dark ? "#deebff" : "#3f4347";

  const hoverBg = isMultiverse
    ? dark ? "rgba(97, 122, 232, 0.28)" : "rgba(75, 95, 192, 0.1)"
    : isAnimals
      ? dark ? "rgba(121, 183, 78, 0.26)" : "rgba(78, 111, 42, 0.1)"
      : dark ? "rgba(104, 146, 199, 0.24)" : "rgba(91, 101, 115, 0.12)";
  const hoverColor = isMultiverse
    ? dark ? "#f0f4ff" : "#3950ba"
    : isAnimals
      ? dark ? "#f0fae2" : "#3e6722"
      : dark ? "#f4f8ff" : "#3f5b7e";

  const ctaGradient = isMultiverse
    ? dark ? "linear-gradient(135deg,#5a73e0,#86a4ff)" : "linear-gradient(135deg,#4b5fc0,#687ff1)"
    : isAnimals
      ? dark ? "linear-gradient(135deg,#5d9138,#84b95a)" : "linear-gradient(135deg,#4e6f2a,#6d8a3a)"
      : dark ? "linear-gradient(135deg,#4b7eb7,#6ea8dc)" : "linear-gradient(135deg,#3a6d99,#5a96c3)";
  const ctaShadow = isMultiverse
    ? dark ? "0 8px 20px rgba(70,95,206,0.38)" : "0 4px 14px rgba(75,95,192,0.35)"
    : isAnimals
      ? dark ? "0 8px 20px rgba(76,122,41,0.34)" : "0 4px 14px rgba(78,111,42,0.35)"
      : dark ? "0 8px 20px rgba(57,102,153,0.35)" : "0 4px 14px rgba(58,109,153,0.33)";

  const navLinks = [
    { href: "/", Icon: HomeIcon, label: "Inicio" },
    { href: "/reveal?universe=animals", Icon: Squares2X2Icon, label: "Catálogo" },
    { href: "/#compras", Icon: ShoppingCartIcon, label: "Tienda", isAnchor: true },
    { href: "/coleccion", Icon: RectangleStackIcon, label: "Colección" },
    { href: "/faq", Icon: QuestionMarkCircleIcon, label: "FAQ" },
    { href: "/acerca", Icon: InformationCircleIcon, label: "Acerca" },
  ];

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
    <header
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
        <nav className="hidden items-center gap-1 text-sm font-semibold sm:flex" aria-label="Navegación principal">
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
          {isAdmin ? (
            <Link
              href="/admin/doflins"
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-amber-600"
            >
              <ShieldCheckIcon className="h-4 w-4" />
              Admin
            </Link>
          ) : null}
          <a
            href="/#compras"
            className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: ctaGradient, boxShadow: ctaShadow }}
          >
            <GlobeAltIcon className="h-4 w-4" />
            Comprar packs
          </a>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  GlobeAltIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  RectangleStackIcon,
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
  const [universe, setUniverse] = useState<Universe>("animals");
  const dark = useDarkMode();

  useEffect(() => {
    setUniverse(getStoredUniverse());
    return onUniverseChange(setUniverse);
  }, []);

  const isMultiverse = universe === "multiverse";

  const headerBg = isMultiverse
    ? dark ? "rgba(10, 14, 36, 0.92)" : "rgba(238, 241, 255, 0.92)"
    : dark ? "rgba(24, 30, 18, 0.92)" : "rgba(249, 247, 237, 0.92)";

  const headerBorder = isMultiverse
    ? dark ? "rgba(30, 42, 74, 0.8)" : "rgba(197, 208, 255, 0.8)"
    : dark ? "rgba(42, 61, 30, 0.8)" : "rgba(211, 222, 187, 0.8)";

  const navColor = isMultiverse
    ? dark ? "#8fa3e0" : "#2d3f8a"
    : dark ? "#a4b68e" : "#445538";

  const hoverBg = isMultiverse ? "rgba(75,95,192,0.10)" : "rgba(78,111,42,0.10)";
  const hoverColor = isMultiverse ? "#4b5fc0" : "#4e6f2a";

  const ctaGradient = isMultiverse
    ? "linear-gradient(135deg,#4b5fc0,#687ff1)"
    : "linear-gradient(135deg,#4e6f2a,#6d8a3a)";
  const ctaShadow = isMultiverse
    ? "0 4px 14px rgba(75,95,192,0.35)"
    : "0 4px 14px rgba(78,111,42,0.35)";

  const navLinks = [
    { href: "/reveal?universe=animals", Icon: Squares2X2Icon, label: "Catálogo" },
    { href: "#compras", Icon: ShoppingCartIcon, label: "Tienda", isAnchor: true },
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
          <a
            href="#compras"
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: ctaGradient, boxShadow: ctaShadow }}
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


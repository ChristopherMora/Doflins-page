"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

const STORAGE_KEY = "doflins_theme";

export function DarkModeToggle() {
  const [dark, setDark] = useState(() => false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    // Schedule the state update after paint to avoid cascading renders
    const raf = requestAnimationFrame(() => setDark(isDark));
    return () => cancelAnimationFrame(raf);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    const theme = next ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-600 hover:text-ink-900 hover:bg-surface-100 transition-colors overflow-hidden"
    >
      <span key={dark ? "sun" : "moon"} className="block animate-[iconSpin_0.22s_ease-out]">
        {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
      </span>
    </button>
  );
}

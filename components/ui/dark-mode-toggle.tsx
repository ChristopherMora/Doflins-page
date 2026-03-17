"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
      <AnimatePresence mode="wait" initial={false}>
        {dark ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="block"
          >
            <SunIcon className="w-5 h-5" />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="block"
          >
            <MoonIcon className="w-5 h-5" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ChevronUpIcon } from "@heroicons/react/24/solid";

export function BackToTop(): React.JSX.Element | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = (): void => {
      setVisible(window.scrollY > 450);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="Volver al inicio de la página"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+6rem)] right-4 z-50 grid h-11 w-11 place-items-center rounded-full bg-[var(--brand-primary)] text-white shadow-[0_6px_20px_rgba(0,0,0,0.22)] transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 active:scale-95 sm:bottom-6 lg:bottom-8"
      style={{ animation: "btt-fadein 0.2s ease" }}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ChevronUpIcon className="h-5 w-5" />
    </button>
  );
}

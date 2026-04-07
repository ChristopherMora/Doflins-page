"use client";

import { useEffect } from "react";

export function MegaCinematicIntro({ show, onComplete }: { show: boolean; onComplete: () => void }): React.JSX.Element | null {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div
      className="mega-intro-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-[#1a0e00]/92"
      style={{ pointerEvents: "none" }}
    >
      <div className="mega-intro-text flex flex-col items-center gap-2">
        <span className="text-[6rem] font-black tracking-[0.1em] text-amber-400 sm:text-[10rem] md:text-[14rem]" style={{ fontFamily: "var(--font-title), Trebuchet MS, sans-serif" }}>
          MEGA
        </span>
        <span className="text-lg font-bold uppercase tracking-[0.5em] text-amber-300/70 sm:text-xl">
          Animals
        </span>
      </div>
      {Array.from({ length: 8 }, (_, i) => (
        <span
          key={i}
          className="mega-debris absolute rounded-full"
          style={{
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            backgroundColor: `rgba(220, 160, 40, ${0.4 + (i % 3) * 0.2})`,
            left: `${18 + i * 8}%`,
            bottom: "35%",
            animationDuration: `${1.5 + i * 0.15}s`,
            animationDelay: `${0.1 + i * 0.06}s`,
          }}
        />
      ))}
    </div>
  );
}

export function MegaScaleComparison(): React.JSX.Element {
  return (
    <div className="mega-silhouette flex items-end gap-3 rounded-2xl border border-amber-200/50 bg-amber-50/60 px-4 py-3">
      <div className="flex flex-col items-center gap-1">
        <svg width="16" height="32" viewBox="0 0 16 32" fill="none" className="text-amber-800/40">
          <circle cx="8" cy="4" r="3.5" fill="currentColor" />
          <path d="M8 8v10M3 12h10M5 28l3-10 3 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700/60">Normal</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-5xl leading-none">🦣</span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700">MEGA</span>
      </div>
      <div className="ml-2 flex flex-col text-[10px] font-semibold text-amber-800/70">
        <span>Presencia XL</span>
        <span className="text-amber-600">Escala masiva</span>
      </div>
    </div>
  );
}

export function MegaDecorations(): React.JSX.Element {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
      <span className="mega-deco-footprint" style={{ top: "6%", left: "2%", animationDelay: "0s" }}>🦶</span>
      <span className="mega-deco-footprint" style={{ top: "18%", right: "3%", animationDelay: "-2s", fontSize: "3rem", opacity: 0.06 }}>💥</span>
      <span className="mega-deco-footprint" style={{ top: "45%", left: "1%", animationDelay: "-4s", fontSize: "3.5rem", opacity: 0.05 }}>🦶</span>
      <span className="mega-deco-footprint" style={{ top: "60%", right: "2%", animationDelay: "-1.5s", fontSize: "4.5rem" }}>🦣</span>
    </div>
  );
}

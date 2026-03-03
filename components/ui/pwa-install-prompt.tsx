"use client";

import { useEffect, useState } from "react";
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt(): React.JSX.Element | null {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] left-3 right-3 z-50 mx-auto max-w-sm rounded-2xl border border-[#c9da9a] bg-[linear-gradient(135deg,#f5f8e8,#eef4df)] p-4 shadow-[0_12px_28px_rgba(50,80,25,0.26)] lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-xs">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)]">
          <ArrowDownTrayIcon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--ink-900)]">Agregar a pantalla de inicio</p>
          <p className="mt-0.5 text-xs text-[var(--ink-700)]">
            Accede a tu colección DOFLINS en un toque, sin abrir el navegador.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="rounded-full bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] px-4 py-1.5 text-xs font-bold text-white transition hover:brightness-110 active:scale-95"
              onClick={async () => {
                if (!deferredPrompt) return;
                await deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === "accepted" || outcome === "dismissed") {
                  setDeferredPrompt(null);
                }
              }}
            >
              Instalar
            </button>
            <button
              type="button"
              className="rounded-full border border-[#c9da9a] bg-white/80 px-4 py-1.5 text-xs font-semibold text-[var(--ink-700)] transition hover:bg-white active:scale-95"
              onClick={() => setDismissed(true)}
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Cerrar sugerencia de instalación"
          className="shrink-0 rounded-full p-1 transition hover:bg-black/[0.07]"
          onClick={() => setDismissed(true)}
        >
          <XMarkIcon className="h-4 w-4 text-[var(--ink-600)]" />
        </button>
      </div>
    </div>
  );
}

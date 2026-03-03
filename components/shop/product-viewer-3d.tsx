"use client";

import { useEffect, useRef, useState } from "react";
import { CubeIcon, XMarkIcon } from "@heroicons/react/24/solid";

import { ensureModelViewer } from "@/components/reveal/figure-3d";

export { resolveProductModelUrl } from "@/lib/shop/product-model";

interface ProductViewer3DProps {
  modelUrl: string;
  productTitle: string;
  posterUrl?: string;
}

export function ProductViewer3D({ modelUrl, productTitle, posterUrl }: ProductViewer3DProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    void ensureModelViewer();
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#cfdab2] bg-[linear-gradient(135deg,#eef5df,#e0edd0)] px-5 py-4 text-sm font-semibold text-[#2f5b1f] shadow-sm transition hover:bg-[#dff0c6] hover:shadow-md active:scale-[0.98]"
      >
        <CubeIcon className="h-5 w-5" />
        Ver en 3D — gira e inspecciona la figura
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#cfdab2] bg-[linear-gradient(145deg,#f7f8eb,#e8efde)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#d8d2b4]">
        <div className="flex items-center gap-2">
          <CubeIcon className="h-4 w-4 text-[#4e6f2a]" />
          <span className="text-xs font-semibold text-[var(--ink-800)]">Vista 3D</span>
          <span className="text-[10px] text-[var(--ink-500)]">Arrastra para rotar · pellizca para zoom</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-full p-1 hover:bg-black/[0.08] transition"
          aria-label="Cerrar visor 3D"
        >
          <XMarkIcon className="h-4 w-4 text-[var(--ink-600)]" />
        </button>
      </div>

      {/* Viewer */}
      <div ref={containerRef} className="relative aspect-square w-full sm:aspect-[4/3]">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#f0f5e8]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d8d2b4] border-t-[#4e6f2a]" />
              <p className="text-xs text-[var(--ink-600)]">Cargando modelo 3D…</p>
            </div>
          </div>
        )}
        <model-viewer
          src={modelUrl}
          alt={productTitle}
          auto-rotate
          camera-controls
          shadow-intensity="1.2"
          environment-image="neutral"
          exposure="0.9"
          poster={posterUrl}
          style={{ width: "100%", height: "100%", background: "transparent" }}
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    </div>
  );
}

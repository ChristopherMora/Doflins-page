"use client";

import { useEffect, useState } from "react";
import { RARITY_CONFIG } from "@/lib/constants/rarity";

// ── Slug helper ─────────────────────────────────────────────────────────────
export function toSlugPreview(rawValue: string): string {
  return rawValue
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── File-name → proper doflin name ──────────────────────────────────────────
export function fileNameToDoflinName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");
  const normalized = withoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "Doflin";
  }

  return normalized
    .split(" ")
    .map((word) => {
      if (!word) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

// ── Object URL hook ─────────────────────────────────────────────────────────
export function useObjectUrl(file: File | null): string | null {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!file) { setSrc(null); return; }
    let active = true;
    const url = URL.createObjectURL(file);
    if (active) setSrc(url);
    return () => { active = false; URL.revokeObjectURL(url); };
  }, [file]);
  return src;
}

// ── Image preview component ─────────────────────────────────────────────────
export function ImagePreview({ file }: { file: File }): React.JSX.Element | null {
  const src = useObjectUrl(file);
  if (!src) return null;
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-[#d8d2b4] bg-[#fafafa] p-1.5 flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Vista previa" className="h-28 w-auto max-w-full object-contain rounded-lg" />
    </div>
  );
}

// ── Catalog card preview component ──────────────────────────────────────────
export function CatalogCardPreview({
  name,
  rarity,
  collectionNumber,
  series,
  imageFile,
}: {
  name: string;
  rarity: string;
  collectionNumber: string;
  series: string;
  imageFile: File | null;
}): React.JSX.Element {
  const src = useObjectUrl(imageFile);

  const cfg = RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG] ?? RARITY_CONFIG.COMMON;
  const num = collectionNumber || "?";

  return (
    <div className="space-y-1.5 rounded-xl border border-[#d8d2b4] bg-[#f8f6ee] p-3">
      <p className="text-xs font-semibold text-[var(--ink-700)]">Vista previa en catálogo</p>
      <div className="flex items-start gap-3">
        {/* Tarjeta miniatura */}
        <div
          className="relative flex w-28 shrink-0 flex-col overflow-hidden rounded-xl"
          style={{
            background: `linear-gradient(145deg, ${cfg.softColor}, white)`,
            border: `2px solid ${cfg.color}50`,
          }}
        >
          {/* Badge número */}
          <div
            className="absolute left-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-black leading-none text-white"
            style={{ background: cfg.color }}
          >
            {num}
          </div>
          {/* Área imagen */}
          <div className="relative w-full" style={{ aspectRatio: "1/1", background: cfg.softColor }}>
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={name} className="h-full w-full object-contain p-1.5" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl opacity-25">🐾</div>
            )}
          </div>
          {/* Footer */}
          <div className="px-1.5 py-1">
            <p className="truncate text-[9px] font-bold leading-tight" style={{ color: cfg.color }}>
              {name}
            </p>
            <p className="text-[7px] leading-tight opacity-60" style={{ color: cfg.color }}>
              {series} · {cfg.label}
            </p>
          </div>
        </div>
        <p className="pt-1 text-[10px] leading-relaxed text-[var(--ink-500)]">
          Vista aproximada de cómo aparecerá en el álbum del coleccionista. La imagen se actualiza al seleccionarla.
        </p>
      </div>
    </div>
  );
}

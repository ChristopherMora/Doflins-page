"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LinkIcon,
  ShareIcon,
  ShoppingCartIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";
import { toast } from "sonner";

import { toCatalogRarity, CATALOG_RARITY_CONFIG } from "@/lib/constants/rarity";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import type { DoflinModalProps } from "./types";
import { variantLabel } from "./utils";

export function DoflinModal({
  selectedDoflin,
  onClose,
  catalog,
  catalogIndex,
  onNavigate,
  has3DModel,
  modelConfig,
  purchaseUniverse,
  rarityConfig,
  isOriginal,
  isOwned,
  groupStats,
  variants,
  imageSrc,
  shopUrl,
  isAuthenticated,
  isDark,
  theme,
  onShare: _onShare,
  onMarkOwned,
  onClearOwned,
  onPurchaseIntent,
  onRequestAuth,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  brokenImageIds,
  onImageBroken,
  brokenVariantImageIds,
  onVariantImageBroken,
}: DoflinModalProps): React.JSX.Element {
  const [showShareSheet, setShowShareSheet] = useState(false);

  const shareUrl = selectedDoflin
    ? typeof window !== "undefined"
      ? `${window.location.origin}/carta/${selectedDoflin.id}`
      : `/carta/${selectedDoflin.id}`
    : "";
  const shareText = selectedDoflin
    ? `¡Acabo de sacar una figura ${rarityConfig?.label ?? selectedDoflin.rarity} 🔥 ${selectedDoflin.name} en @doflins! 🎴 #doflins #coleccionables`
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      // ignore
    }
    setShowShareSheet(false);
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
    setShowShareSheet(false);
  };

  const handleShareTikTok = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success("Texto copiado — pégalo en tu video de TikTok 🎵");
    } catch {
      // ignore
    }
    window.open("https://www.tiktok.com", "_blank", "noopener,noreferrer");
    setShowShareSheet(false);
  };

  const handleShareInstagram = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success("Texto copiado — pégalo en tu historia de Instagram 📸");
    } catch {
      // ignore
    }
    setShowShareSheet(false);
  };

  return (
    <Dialog
      open={Boolean(selectedDoflin)}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <DialogContent className="w-[min(96vw,960px)] max-h-[92svh] gap-0 overflow-y-auto p-0 md:overflow-hidden">
        {selectedDoflin ? (
          <>
            <div className="flex flex-col">
              <div className={`grid gap-0 ${has3DModel ? "md:grid-cols-[1.1fr_0.9fr]" : "md:grid-cols-[1fr_1fr]"}`}>
                {/* LEFT — image panel */}
                <div className={`relative flex min-h-[260px] items-center justify-center overflow-hidden md:min-h-[400px] ${
                  purchaseUniverse === "multiverse"
                    ? "bg-[linear-gradient(145deg,#111028,#1e1c48,#262450)]"
                    : purchaseUniverse === "mega"
                    ? "bg-[linear-gradient(145deg,#1a1208,#2a1e08,#3a2c10)]"
                    : "bg-[linear-gradient(145deg,#101410,#182018,#1e2a1e)]"
                }`}>
                  {catalog.length > 1 ? (
                    <>
                      <button type="button" aria-label="Doflin anterior"
                        disabled={catalogIndex <= 0}
                        onClick={() => { const prev = catalog[catalogIndex - 1]; if (prev) onNavigate(prev); }}
                        className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm ring-1 ring-white/20 transition hover:bg-white/30 disabled:opacity-20 active:scale-95">
                        <ChevronLeftIcon className="h-4 w-4" />
                      </button>
                      <button type="button" aria-label="Doflin siguiente"
                        disabled={catalogIndex >= catalog.length - 1}
                        onClick={() => { const next = catalog[catalogIndex + 1]; if (next) onNavigate(next); }}
                        className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm ring-1 ring-white/20 transition hover:bg-white/30 disabled:opacity-20 active:scale-95">
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    </>
                  ) : null}
                  <div className={`pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] opacity-25 ${
                    purchaseUniverse === "multiverse" ? "bg-indigo-400" : purchaseUniverse === "mega" ? "bg-amber-500" : "bg-emerald-600"
                  }`} />
                  <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md ring-1 ring-white/20">
                    {purchaseUniverse === "multiverse" ? "⚡ Multiverse" : purchaseUniverse === "mega" ? "🦣 Mega Animals" : "🌿 Animals"}
                  </span>
                  {has3DModel ? (
                    <model-viewer
                      src={modelConfig?.modelUrl ?? ""}
                      alt={selectedDoflin.name}
                      poster={selectedDoflin.imageUrl}
                      orientation={modelConfig?.orientation}
                      camera-orbit={modelConfig?.cameraOrbit ?? "0deg 60deg auto"}
                      field-of-view={modelConfig?.fieldOfView ?? "28deg"}
                      shadow-intensity="0.7" exposure="1.2"
                      camera-controls auto-rotate interaction-prompt="none"
                      className="relative z-10 h-[260px] w-full md:h-[400px]"
                      style={{ background: "transparent", display: "block" }}
                    />
                  ) : (
                    <div className="relative z-10 flex flex-col items-center gap-3 p-5 md:gap-4 md:p-8">
                      <div className="relative flex h-[200px] w-[160px] items-center justify-center overflow-hidden rounded-[1.5rem] shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_24px_48px_rgba(0,0,0,0.45)] md:h-[260px] md:w-[205px] md:rounded-[2rem]">
                        <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] md:rounded-[2rem]" />
                        <div className="pointer-events-none absolute inset-x-10 bottom-3 h-5 rounded-full bg-black/40 blur-xl" />
                        <Image
                          src={imageSrc}
                          alt={selectedDoflin.name}
                          width={780} height={780}
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="h-full w-full object-cover"
                          onError={() => {
                            onImageBroken((prev) => {
                              if (prev.includes(selectedDoflin.id)) return prev;
                              return [...prev, selectedDoflin.id];
                            });
                          }}
                        />
                      </div>
                      {rarityConfig ? (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold shadow-[0_4px_16px_rgba(0,0,0,0.3)] backdrop-blur-sm"
                          style={{ backgroundColor: rarityConfig.softColor, color: rarityConfig.color }}
                        >
                          {rarityConfig.probability}% · {rarityConfig.label}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* RIGHT — info panel */}
                <div className="flex flex-col bg-[var(--surface-50)] md:max-h-[92svh] md:overflow-hidden">
                  <div className="flex flex-1 flex-col gap-4 p-5 md:overflow-y-auto md:p-6">
                    <div className="flex items-start justify-between gap-3 pr-6">
                      <div>
                        <p className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-400)]">
                          Serie {selectedDoflin.series} · #{String(selectedDoflin.collectionNumber).padStart(2, "0")}
                        </p>
                        <h2 className="font-title text-2xl font-bold leading-tight text-[var(--ink-900)]">
                          {selectedDoflin.name}
                        </h2>
                        <p className="mt-0.5 text-sm text-[var(--ink-500)]">{selectedDoflin.baseModel}</p>
                      </div>
                      <div className="relative flex shrink-0 items-center gap-1">
                        <button type="button" aria-label="Compartir"
                          onClick={() => { setShowShareSheet((v) => !v); }}
                          className="rounded-full p-2 text-[var(--ink-400)] transition hover:bg-black/[0.06] hover:text-[var(--ink-800)]">
                          <ShareIcon className="h-4 w-4" />
                        </button>
                        {showShareSheet ? (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => { setShowShareSheet(false); }} />
                            <div className="absolute right-0 top-full z-20 mt-1 flex min-w-[190px] flex-col overflow-hidden rounded-xl border border-[var(--surface-200)] bg-[var(--surface-50)] shadow-xl">
                              <button type="button" onClick={() => { void handleShareTikTok(); }}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--ink-700)] transition hover:bg-black/[0.04]">
                                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.69a8.18 8.18 0 004.78 1.52V6.77a4.85 4.85 0 01-1.02-.08z"/>
                                </svg>
                                TikTok
                              </button>
                              <button type="button" onClick={() => { void handleShareInstagram(); }}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--ink-700)] transition hover:bg-black/[0.04]">
                                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                                Instagram
                              </button>
                              <button type="button" onClick={handleShareWhatsApp}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--ink-700)] transition hover:bg-black/[0.04]">
                                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                WhatsApp
                              </button>
                              <button type="button" onClick={() => { void handleCopyLink(); }}
                                className="flex items-center gap-3 border-t border-[var(--surface-200)] px-4 py-3 text-sm text-[var(--ink-700)] transition hover:bg-black/[0.04]">
                                <LinkIcon className="h-4 w-4 shrink-0" />
                                Copiar enlace
                              </button>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                        isOriginal
                          ? isDark
                            ? "bg-[#1f3414] text-[#cbe4ab] ring-1 ring-[#4d6d37]"
                            : "bg-[#eaf5d8] text-[#2f5b1f] ring-1 ring-[#c6dba0]"
                          : isDark
                            ? "bg-[#182653] text-[#c6d5ff] ring-1 ring-[#4f67b9]"
                            : "bg-[#e9efff] text-[#2f448f] ring-1 ring-[#c9d6ff]"
                      }`}>
                        {isOriginal ? "Animal original" : "Variante"}
                      </span>
                      {rarityConfig ? (
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold"
                          style={{ backgroundColor: rarityConfig.softColor, color: rarityConfig.color }}>
                          {rarityConfig.label}
                        </span>
                      ) : null}
                      {rarityConfig ? (
                        <span className="inline-flex items-center rounded-full bg-[var(--surface-100)] px-3 py-1 text-[11px] font-semibold text-[var(--ink-600)] ring-1 ring-black/[0.07]">
                          {rarityConfig.probability}% drop rate
                        </span>
                      ) : null}
                    </div>

                    {selectedDoflin.funFact ? (
                      <div className="rounded-2xl bg-[var(--surface-100)] p-4 ring-1 ring-black/[0.06]">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <SparklesIcon className="h-3.5 w-3.5 text-[var(--brand-accent)]" />
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-500)]">Dato curioso</p>
                        </div>
                        <p className="text-sm leading-relaxed text-[var(--ink-700)]">{selectedDoflin.funFact}</p>
                      </div>
                    ) : null}

                    <div className={`flex items-center justify-between gap-3 rounded-2xl p-4 ring-1 ring-black/[0.06] ${
                      isAuthenticated && isOwned
                        ? isDark
                          ? "bg-[#1f3414]"
                          : "bg-[#eaf5d8]"
                        : "bg-[var(--surface-100)]"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isAuthenticated && isOwned ? "bg-[var(--brand-primary)]" : "bg-[var(--surface-50)] ring-1 ring-black/10"
                        }`}>
                          <CheckCircleIcon className={`h-5 w-5 ${isAuthenticated && isOwned ? "text-white" : "text-[var(--ink-300)]"}`} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--ink-600)]">Tu colección</p>
                          <p className="text-sm font-semibold text-[var(--ink-900)]">
                            {isAuthenticated
                              ? isOwned ? "Ya la tienes ✓" : "No la tienes aún"
                              : "Crea cuenta gratis"}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className={`shrink-0 ${isAuthenticated && !isOwned ? theme.primaryButton : ""}`}
                        variant={!isAuthenticated ? "secondary" : isOwned ? "secondary" : "primary"}
                        onClick={() => {
                          if (!isAuthenticated) { onRequestAuth(); return; }
                          if (isOwned) { onClearOwned(selectedDoflin.id); } else { onMarkOwned(selectedDoflin.id); }
                        }}
                      >
                        {!isAuthenticated ? "Entrar" : isOwned ? "Quitar" : "Marcar"}
                      </Button>
                    </div>
                  </div>

                  <div className="shrink-0 border-t border-black/[0.07] bg-[var(--surface-50)] p-4">
                    <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-400)]">Comprar sobres</p>
                    <div className="flex gap-2">
                      <Button asChild className={`flex-1 ${theme.primaryButton}`}>
                        <a href={shopUrl} onClick={() => onPurchaseIntent({ source: "modal_buy", packSize: 15, doflinId: selectedDoflin.id })}>
                          <ShoppingCartIcon className="h-4 w-4 shrink-0" />
                          <span className="flex flex-col items-start leading-tight">
                            <span className="font-bold">Sobre ×15</span>
                            <span className="text-[10px] opacity-75">Más chances</span>
                          </span>
                          <span className="ml-auto shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide">MEJOR</span>
                        </a>
                      </Button>
                      <Button asChild variant="secondary" className="w-[72px] shrink-0 flex-col gap-0 px-3 py-2 h-auto">
                        <a href={shopUrl} onClick={() => onPurchaseIntent({ source: "modal_buy", packSize: 5, doflinId: selectedDoflin.id })}>
                          <span className="text-sm font-bold">×5</span>
                          <span className="text-[10px] opacity-60">Probar</span>
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {variants.length > 1 ? (
                <div className="border-t border-black/[0.06] bg-[var(--surface-50,#f9f9f9)] px-6 py-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-400)]">
                    {groupStats?.total ?? variants.length} variantes · {selectedDoflin.baseModel}
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                    {variants.map((variant) => {
                      const isCurrent = variant.id === selectedDoflin.id;
                      const vRarity = toCatalogRarity(variant.rarity);
                      const vConfig = CATALOG_RARITY_CONFIG[vRarity];
                      return (
                        <button key={variant.id} type="button" onClick={() => onNavigate(variant)}
                          className={`group relative flex shrink-0 flex-col overflow-hidden rounded-xl bg-[var(--surface-50)] transition-all duration-150 ${
                            isCurrent
                              ? "shadow-[0_0_0_2.5px_var(--brand-primary),0_6px_20px_rgba(0,0,0,0.14)]"
                              : "shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.10)]"
                          }`} style={{ width: 96 }}>
                          <div className="h-1 w-full" style={{ backgroundColor: vConfig.color }} />
                          <div className="relative h-[80px] w-full overflow-hidden" style={{ backgroundColor: vConfig.softColor }}>
                            {brokenVariantImageIds.has(variant.id) || !variant.imageUrl ? (
                              <div className="flex h-full w-full flex-col items-center justify-center gap-1 opacity-55">
                                <svg viewBox="0 0 32 32" className="h-9 w-9" fill="none" style={{ color: vConfig.color }}>
                                  <path d="M16 28 C16 28 5 22 5 13 C5 7 10 3 16 3 C22 3 27 7 27 13 C27 22 16 28 16 28Z" fill="currentColor" opacity="0.18"/>
                                  <path d="M16 28 C16 28 5 22 5 13 C5 7 10 3 16 3 C22 3 27 7 27 13 C27 22 16 28 16 28Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
                                  <path d="M16 28 L16 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.7"/>
                                  <path d="M16 14 C12 11 9 11 7 12" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
                                  <path d="M16 14 C20 11 23 11 25 12" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
                                  <path d="M16 19 C13 17 10 17 8 18" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
                                  <path d="M16 19 C19 17 22 17 24 18" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
                                </svg>
                              </div>
                            ) : (
                              <Image src={variant.imageUrl} alt={variant.name} fill
                                sizes="96px"
                                className="object-cover transition duration-200 group-hover:scale-[1.06]"
                                onError={() => onVariantImageBroken((prev) => { const next = new Set(prev); next.add(variant.id); return next; })}
                              />
                            )}
                            {isCurrent ? (
                              <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full shadow-sm" style={{ backgroundColor: "var(--brand-primary)" }}>
                                <CheckCircleIcon className="h-3.5 w-3.5 text-white" />
                              </div>
                            ) : null}
                          </div>
                          <div className="flex flex-col gap-0.5 px-2 py-2">
                            <p className="truncate text-left text-[11px] font-semibold text-[var(--ink-900)]">
                              {variantLabel(variant.variantName)}
                            </p>
                            <span className="text-[9px] font-bold" style={{ color: vConfig.color }}>
                              {vConfig.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

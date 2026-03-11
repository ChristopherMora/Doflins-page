"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardDocumentIcon,
  CheckIcon,
  ShareIcon,
  GiftIcon,
  UserGroupIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";



interface ReferralData {
  code: string;
  discountPercent: number;
  usesCount: number;
  active: boolean;
  shareUrl: string;
  shopifyCode: string;
  uses: {
    id: number;
    usedByEmail: string | null;
    discountApplied: number;
    createdAt: string;
  }[];
}

export function ReferralCard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchReferral = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/referral");
      if (res.status === 401) {
        setError("Inicia sesión para ver tu código de referido.");
        return;
      }
      if (res.status === 503) {
        setError("El sistema de referidos no está disponible aún. Contacta al equipo DOFLINS.");
        return;
      }
      if (!res.ok) throw new Error("Error al cargar código");
      const json = (await res.json()) as ReferralData;
      setData(json);
    } catch {
      setError("No se pudo cargar tu código de referido.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReferral();
  }, [fetchReferral]);

  const copyCode = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.shopifyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const share = async () => {
    if (!data) return;
    if (navigator.share) {
      await navigator.share({
        title: "¡Descuento en DOFLINS!",
        text: `Usa mi código ${data.shopifyCode} y obtén ${data.discountPercent}% de descuento en tu primer sobre DOFLINS 🎁`,
        url: data.shareUrl,
      });
    } else {
      await copyLink();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-3xl bg-[var(--surface-100)]" />
        <div className="h-20 animate-pulse rounded-3xl bg-[var(--surface-100)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-[var(--surface-200)] bg-[var(--surface-50)] p-6 text-center space-y-3">
        <GiftIcon className="mx-auto h-8 w-8 text-[var(--ink-300)]" />
        <p className="text-sm text-[var(--ink-600)]">{error}</p>
        <button
          onClick={() => void fetchReferral()}
          className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Hero del código */}
      <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--brand-primary),var(--brand-accent))] p-6 text-white shadow-[0_20px_50px_rgba(78,111,42,0.35)]">
        {/* Decoración */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-black/10" />

        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <GiftIcon className="h-5 w-5 opacity-90" />
            <span className="text-sm font-bold uppercase tracking-wide opacity-90">
              Tu código de referido
            </span>
          </div>

          {/* Código grande */}
          <div className="flex items-center gap-3">
            <span className="font-title text-4xl font-black tracking-widest">
              {data.shopifyCode}
            </span>
            <button
              onClick={copyCode}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 transition hover:bg-white/30 active:scale-95"
              aria-label="Copiar código"
            >
              {copiedCode ? (
                <CheckIcon className="h-5 w-5" />
              ) : (
                <ClipboardDocumentIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          <p className="text-sm font-medium opacity-85">
            Tus amigos obtienen <strong>{data.discountPercent}% de descuento</strong> en su primer sobre al usar este código en el checkout de Shopify.
          </p>

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={share}
              className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/30 active:scale-95"
            >
              <ShareIcon className="h-4 w-4" />
              {copiedLink ? "¡Copiado!" : "Compartir"}
            </button>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/30 active:scale-95"
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
              Copiar link
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[var(--surface-200)] bg-[var(--surface-50)] p-4">
          <div className="flex items-center gap-2 text-[var(--ink-600)]">
            <UserGroupIcon className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Usos totales</span>
          </div>
          <p className="mt-2 text-3xl font-black text-[var(--ink-900)]">{data.usesCount}</p>
          <p className="text-xs text-[var(--ink-500)]">personas que usaron tu código</p>
        </div>
        <div className="rounded-2xl border border-[var(--surface-200)] bg-[var(--surface-50)] p-4">
          <div className="flex items-center gap-2 text-[var(--ink-600)]">
            <SparklesIcon className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Descuento</span>
          </div>
          <p className="mt-2 text-3xl font-black text-[var(--ink-900)]">{data.discountPercent}%</p>
          <p className="text-xs text-[var(--ink-500)]">en cualquier sobre DOFLINS</p>
        </div>
      </div>

      {/* Cómo funciona */}
      <div className="rounded-3xl border border-[var(--surface-200)] bg-[var(--surface-50)] p-5 space-y-3">
        <p className="text-sm font-bold text-[var(--ink-800)]">¿Cómo funciona?</p>
        <ol className="space-y-2 text-sm text-[var(--ink-700)]">
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[10px] font-black text-white">1</span>
            Comparte tu código o link con amigos
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[10px] font-black text-white">2</span>
            Tu amigo ingresa el código <strong>{data.shopifyCode}</strong> al finalizar su compra en Shopify
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[10px] font-black text-white">3</span>
            Obtienen <strong>{data.discountPercent}% de descuento</strong> en su primer sobre
          </li>
        </ol>
      </div>

      {/* Historial de usos */}
      {data.uses.length > 0 ? (
        <div className="rounded-3xl border border-[var(--surface-200)] bg-[var(--surface-50)] p-5 space-y-3">
          <p className="text-sm font-bold text-[var(--ink-800)]">Usos recientes</p>
          <ul className="space-y-2">
            {data.uses.map((use) => (
              <li key={use.id} className="flex items-center justify-between text-xs text-[var(--ink-600)]">
                <span>{use.usedByEmail ?? "Usuario anónimo"}</span>
                <span className="font-semibold text-[var(--brand-primary)]">
                  {new Date(use.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardDocumentIcon,
  CheckIcon,
  ShareIcon,
  GiftIcon,
  UserGroupIcon,
  SparklesIcon,
  StarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface ReferralData {
  code: string;
  discountPercent: number;
  usesCount: number;
  active: boolean;
  pointsPerUse: number;
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
  const [sharedSuccess, setSharedSuccess] = useState(false);

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
      try {
        await navigator.share({
          title: "¡Descuento en DOFLINS!",
          text: `Usa mi código ${data.shopifyCode} y obtén ${data.discountPercent}% de descuento en tu primer sobre DOFLINS 🎁`,
          url: data.shareUrl,
        });
        setSharedSuccess(true);
        setTimeout(() => setSharedSuccess(false), 2000);
      } catch {
        // usuario canceló el share — no hacer nada
      }
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

  const totalPointsEarned = data.usesCount * data.pointsPerUse;

  return (
    <div className="space-y-4">
      {/* Aviso de código inactivo */}
      {!data.active && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Código pausado</p>
            <p className="text-xs text-amber-700">Tu código de referido está temporalmente inactivo. Contacta al equipo DOFLINS para reactivarlo.</p>
          </div>
        </div>
      )}

      {/* Hero del código */}
      <div className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-[0_20px_50px_rgba(78,111,42,0.35)] ${data.active ? "bg-[linear-gradient(135deg,var(--brand-primary),var(--brand-accent))]" : "bg-[linear-gradient(135deg,#9ca3af,#6b7280)]"}`}>
        {/* Decoración */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-black/10" />

        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <GiftIcon className="h-5 w-5 opacity-90" />
            <span className="text-sm font-bold uppercase tracking-wide opacity-90">
              Tu código de referido
            </span>
            {!data.active && (
              <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                Inactivo
              </span>
            )}
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
            Tus amigos obtienen <strong>{data.discountPercent}% de descuento</strong> en su primer sobre, y tú ganas <strong>{data.pointsPerUse} pts</strong> por cada uno.
          </p>

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={share}
              disabled={!data.active}
              className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sharedSuccess ? <CheckIcon className="h-4 w-4" /> : <ShareIcon className="h-4 w-4" />}
              {sharedSuccess ? "¡Compartido!" : "Compartir"}
            </button>
            <button
              onClick={copyLink}
              disabled={!data.active}
              className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copiedLink ? <CheckIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
              {copiedLink ? "¡Copiado!" : "Copiar link"}
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
          <p className="text-xs text-[var(--ink-500)]">para tus amigos en Shopify</p>
        </div>
      </div>

      {/* Stat pts ganados — destacado */}
      <div className="flex items-center justify-between rounded-2xl border border-[#b8d493] bg-[#eef5df] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4e6f2a]">
            <StarIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4e6f2a]">Puntos ganados por referidos</p>
            <p className="font-title text-2xl font-black text-[#2d4915]">{totalPointsEarned.toLocaleString("es-MX")} pts</p>
          </div>
        </div>
        <span className="rounded-full bg-[#4e6f2a]/10 px-2.5 py-1 text-xs font-bold text-[#2d4915]">
          +{data.pointsPerUse} pts / uso
        </span>
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
            Tu amigo obtiene <strong>{data.discountPercent}% de descuento</strong> y tú ganas <strong>{data.pointsPerUse} pts</strong> en tu cuenta DOFLINS
          </li>
        </ol>
      </div>

      {/* Historial de usos */}
      {data.uses.length > 0 ? (
        <div className="rounded-3xl border border-[var(--surface-200)] bg-[var(--surface-50)] p-5 space-y-3">
          <p className="text-sm font-bold text-[var(--ink-800)]">Usos recientes</p>
          <ul className="divide-y divide-[var(--surface-200)]">
            {data.uses.map((use) => (
              <li key={use.id} className="flex items-center justify-between py-2.5 text-xs text-[var(--ink-600)]">
                <span>{use.usedByEmail ?? "Usuario anónimo"}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#eef5df] px-2 py-0.5 text-[10px] font-bold text-[#4e6f2a]">
                    +{data.pointsPerUse} pts
                  </span>
                  <span className="font-semibold text-[var(--brand-primary)]">
                    {new Date(use.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

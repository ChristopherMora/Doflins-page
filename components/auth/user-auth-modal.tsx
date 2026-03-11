"use client";

import { useState } from "react";
import { EnvelopeIcon, SparklesIcon, XMarkIcon } from "@heroicons/react/24/solid";
import type { User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface UserAuthModalProps {
  onClose: () => void;
  onAuthenticated?: (user: User) => void;
  redirectTo?: string;
}

type AuthStep = "choose" | "magic-link" | "sent";

export function UserAuthModal({ onClose, onAuthenticated: _onAuthenticated, redirectTo = "/coleccion" }: UserAuthModalProps) {
  const [step, setStep] = useState<AuthStep>("choose");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError("Ingresa tu correo electrónico.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { error: supabaseError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/user/callback?next=${redirectTo}`,
        },
      });
      if (supabaseError) throw supabaseError;
      setStep("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al enviar el correo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: supabaseError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/user/callback?next=${redirectTo}`,
        },
      });
      if (supabaseError) throw supabaseError;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error con Google.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ink-light w-full max-w-sm rounded-3xl border border-[#d9d2b3] bg-[linear-gradient(145deg,#fffaf1,#f4f7e9)] p-7 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#eef5df] p-3">
              <SparklesIcon className="h-6 w-6 text-[#4e6f2a]" />
            </div>
            <div>
              <h2 className="font-title text-2xl text-[var(--ink-900)]">Mi Colección</h2>
              <p className="text-xs text-[var(--ink-600)]">Accede para guardar tu progreso</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-black/[0.07] transition"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-5 w-5 text-[var(--ink-600)]" />
          </button>
        </div>

        {step === "choose" && (
          <div className="space-y-3">
            {/* Google */}
            <button
              onClick={() => void handleGoogle()}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#d8d2b4] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink-900)] shadow-sm transition hover:bg-[#f4f6e8] disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 border-t border-[#d8d2b4]" />
              <span className="text-xs text-[var(--ink-500)]">o usa tu correo</span>
              <div className="flex-1 border-t border-[#d8d2b4]" />
            </div>

            <button
              onClick={() => setStep("magic-link")}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#d8d2b4] bg-[#eef5df] px-5 py-3 text-sm font-semibold text-[#2f5b1f] transition hover:bg-[#e0edcc]"
            >
              <EnvelopeIcon className="h-5 w-5" />
              Continuar con Magic Link
            </button>

            {error && <p className="text-xs text-red-600 text-center">{error}</p>}

            <p className="text-[11px] text-center text-[var(--ink-500)] pt-2">
              Al continuar aceptas guardar tu colección DOFLINS en nuestra plataforma.
            </p>
          </div>
        )}

        {step === "magic-link" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--ink-700)]">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleMagicLink(); }}
                placeholder="tu@correo.com"
                className="w-full rounded-2xl border border-[#d8d2b4] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#4e6f2a]/30"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button
              className="w-full bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] text-white"
              onClick={() => void handleMagicLink()}
              disabled={isLoading}
            >
              {isLoading ? "Enviando…" : "Enviar magic link"}
            </Button>
            <button
              onClick={() => setStep("choose")}
              className="w-full text-xs text-[var(--ink-600)] hover:underline"
            >
              ← Volver
            </button>
          </div>
        )}

        {step === "sent" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef5df]">
              <EnvelopeIcon className="h-8 w-8 text-[#4e6f2a]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--ink-900)]">¡Correo enviado!</p>
              <p className="mt-1 text-sm text-[var(--ink-600)]">
                Revisa tu bandeja en <strong>{email}</strong> y haz clic en el enlace para acceder a tu colección.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-2xl border border-[#d8d2b4] bg-white px-5 py-3 text-sm font-medium text-[var(--ink-800)] hover:bg-[#f4f6e8]"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

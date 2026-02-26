"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, ExclamationTriangleIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";

function sanitizeCallback(rawValue: string | null): string {
  if (!rawValue || !rawValue.startsWith("/")) {
    return "/admin/doflins";
  }

  return rawValue;
}

export default function AdminLoginPage(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("/admin/doflins");
  const [authError, setAuthError] = useState<string | null>(null);
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCallbackUrl(sanitizeCallback(params.get("callbackUrl")));
    setAuthError(params.get("error"));
  }, []);

  const hasUnauthorizedError = authError === "unauthorized";
  const hasConfigError = authError === "config";
  const hasOauthError = authError === "oauth";

  const handleGoogleLogin = async (): Promise<void> => {
    if (!hasSupabaseConfig) {
      toast.error("Falta configurar Supabase en .env.local");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setIsLoading(false);
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar sesión con Google.");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-5 py-12 sm:px-8">
      <Card className="w-full overflow-hidden border-0 bg-[linear-gradient(135deg,#edf2ff,#e0e8ff,#d2ddff)] shadow-[0_25px_55px_rgba(69,82,144,0.22)]">
        <CardContent className="space-y-6 p-8 sm:p-12">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#dbe4ff] text-[#1f2c67]">
              <ShieldCheckIcon className="h-4 w-4" /> Modo Admin
            </Badge>
            <Link href="/reveal">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="h-4 w-4" /> Volver a usuario
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            <h1 className="font-title text-4xl text-[var(--ink-900)] sm:text-5xl">Acceso de administrador</h1>
            <p className="max-w-2xl text-[var(--ink-700)]">
              Inicia sesión con Google para administrar catálogo, variantes, altas masivas y estado de figuras.
            </p>
          </div>

          {hasUnauthorizedError ? (
            <div className="rounded-2xl border border-black/10 bg-white/70 p-3 text-sm text-[var(--ink-700)]">
              <p className="flex items-center gap-2 font-semibold text-[var(--ink-900)]">
                <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" /> Esta cuenta no tiene permisos de administrador.
              </p>
              <p className="mt-1 text-xs">Si necesitas acceso, solicita autorización al equipo DOFLINS.</p>
            </div>
          ) : null}

          {hasConfigError ? (
            <div className="rounded-2xl border border-black/10 bg-white/70 p-3 text-sm text-[var(--ink-700)]">
              <p className="flex items-center gap-2 font-semibold text-[var(--ink-900)]">
                <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" /> Acceso administrativo en configuración.
              </p>
              <p className="mt-1 text-xs">Intenta de nuevo en unos minutos.</p>
            </div>
          ) : null}

          {hasOauthError ? (
            <div className="rounded-2xl border border-black/10 bg-white/70 p-3 text-sm text-[var(--ink-700)]">
              <p className="flex items-center gap-2 font-semibold text-[var(--ink-900)]">
                <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" /> No se pudo completar el inicio con Google.
              </p>
              <p className="mt-1 text-xs">Vuelve a intentarlo.</p>
            </div>
          ) : null}

          {!hasSupabaseConfig ? (
            <div className="rounded-2xl border border-black/10 bg-white/70 p-3 text-sm text-[var(--ink-700)]">
              El acceso admin estará disponible cuando termine la configuración de autenticación.
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="bg-[linear-gradient(135deg,#4861c2,#667eee)] text-white"
              onClick={() => void handleGoogleLogin()}
              disabled={isLoading || !hasSupabaseConfig}
            >
              {isLoading ? "Redirigiendo a Google..." : "Continuar con Google"}
            </Button>
          </div>

          <p className="text-xs text-[var(--ink-600)]">
            Si entraste a esta ruta por redirección, después del login volverás a: <span className="font-semibold">{callbackUrl}</span>
          </p>
        </CardContent>
      </Card>
      <Toaster />
    </main>
  );
}

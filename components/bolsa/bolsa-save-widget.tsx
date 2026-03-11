"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  ShoppingCartIcon,
  SparklesIcon,
  UserPlusIcon,
} from "@heroicons/react/24/solid";
import type { User } from "@supabase/supabase-js";

import { UserAuthModal } from "@/components/auth/user-auth-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface SavedDoflin {
  id: number;
  nombre: string;
  rareza: string;
}

interface SaveResult {
  saved: number;
  alreadyOwned?: number;
  duplicateQuantity?: number;
  doflins?: SavedDoflin[];
}

interface BolsaSaveWidgetProps {
  codigo: string;
  doflinCount: number;
}

export function BolsaSaveWidget({ codigo, doflinCount }: BolsaSaveWidgetProps) {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = cargando
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  // Ref guard: bloquea llamadas concurrentes antes de que React re-renderice.
  // Necesario porque getUser() y onAuthStateChange pueden disparar casi
  // simultáneamente → el check saveState !== "idle" no alcanza a atrapar
  // la segunda llamada si el componente aún no se re-renderizó.
  const saveInFlightRef = useRef(false);

  // Observar sesión
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data: d }) => setUser(d.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Auto-guardar cuando el usuario inicia sesión
  useEffect(() => {
    if (!user || saveState !== "idle") return;
    void handleSave();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSave = async () => {
    // Guard síncrono: bloquea la segunda llamada aunque React no haya re-renderizado
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setSaveState("saving");
    try {
      const res = await fetch(`/api/bolsa/${codigo}/save`, { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as SaveResult;
        setSaveResult(data);
        setSaveState("saved");
      } else if (res.status === 401) {
        setSaveState("idle");
      } else {
        saveInFlightRef.current = false; // permitir reintento
        setSaveState("error");
      }
    } catch {
      saveInFlightRef.current = false; // permitir reintento
      setSaveState("error");
    }
  };

  // Aún cargando sesión
  if (user === undefined) {
    return (
      <Card className="overflow-hidden border-2 border-[#c5dca0]">
        <div className="h-1.5 bg-gradient-to-r from-[#4e6f2a] to-[#8ab84a]" />
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#d8d2b4] border-t-[#4e6f2a]" />
            <span className="text-sm text-[var(--ink-500)]">Verificando sesión…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Guardando
  if (saveState === "saving") {
    return (
      <Card className="overflow-hidden border-2 border-[#c5dca0]">
        <div className="h-1.5 bg-gradient-to-r from-[#4e6f2a] to-[#8ab84a]" />
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#d8d2b4] border-t-[#4e6f2a]" />
            <span className="text-sm font-semibold text-[var(--ink-700)]">
              Guardando tus figuras en la colección…
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Guardado exitoso
  if (saveState === "saved" && saveResult) {
    const { saved, alreadyOwned = 0, duplicateQuantity = 0 } = saveResult;
    return (
      <Card className="overflow-hidden border-2 border-[#4e6f2a]">
        <div className="h-1.5 bg-gradient-to-r from-[#4e6f2a] to-[#8ab84a]" />
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf5d8]">
              <CheckCircleIcon className="h-6 w-6 text-[#4e6f2a]" />
            </div>
            <div>
              {saved > 0 ? (
                <>
                  <p className="font-bold text-[#4e6f2a]">
                    ✅ {saved} figura{saved !== 1 ? "s" : ""} guardada{saved !== 1 ? "s" : ""} en tu colección
                  </p>
                  {alreadyOwned > 0 && (
                    <p className="text-xs text-[var(--ink-500)] mt-0.5">
                      {alreadyOwned} duplicada{alreadyOwned !== 1 ? "s" : ""} — ¡coleccionista serio! 🎴
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-bold text-[var(--ink-700)]">¡Tienes {duplicateQuantity} duplicada{duplicateQuantity !== 1 ? "s" : ""}!</p>
                  <p className="text-xs text-[var(--ink-500)] mt-0.5">
                    Todas las figuras de esta bolsa ya estaban en tu colección. Se registraron como duplicados.
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]">
              <Link href="/coleccion">
                <CheckCircleIcon className="h-4 w-4" /> Ver mi colección
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/#compras">
                <ShoppingCartIcon className="h-4 w-4" /> Conseguir más packs
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error
  if (saveState === "error") {
    return (
      <Card className="overflow-hidden border-2 border-red-200">
        <CardContent className="p-6 space-y-3">
          <p className="text-sm font-semibold text-red-700">
            Hubo un error al guardar. Intenta de nuevo.
          </p>
          <Button
            onClick={() => { setSaveState("idle"); void handleSave(); }}
            variant="secondary"
            size="sm"
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No autenticado — mostrar CTA
  return (
    <>
      <Card className="overflow-hidden border-2 border-[#c5dca0]">
        <div className="h-1.5 bg-gradient-to-r from-[#4e6f2a] to-[#8ab84a]" />
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf5d8]">
              <CheckCircleIcon className="h-5 w-5 text-[#4e6f2a]" />
            </div>
            <div>
              <p className="font-bold text-[var(--ink-900)]">
                ¿Ya las tienes? Guarda tu progreso
              </p>
              <p className="text-sm text-[var(--ink-600)] mt-0.5">
                Inicia sesión o crea una cuenta gratis y estas{" "}
                <strong>{doflinCount} figuras</strong> se guardarán automáticamente
                en tu colección.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setAuthModalOpen(true)}
              className="bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]"
            >
              <UserPlusIcon className="h-4 w-4" /> Guardar figuras gratis
            </Button>
            <Button asChild variant="secondary">
              <Link href="/reveal">
                <SparklesIcon className="h-4 w-4" /> Ver catálogo completo
              </Link>
            </Button>
          </div>

          <p className="text-[10px] text-[var(--ink-400)]">
            Gratis · Sin tarjeta · Sincronizado en todos tus dispositivos
          </p>
        </CardContent>
      </Card>

      {authModalOpen ? (
        <UserAuthModal
          onClose={() => setAuthModalOpen(false)}
          redirectTo={`/bolsa/${codigo}`}
          onAuthenticated={() => {
            setAuthModalOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

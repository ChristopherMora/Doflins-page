"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckIcon, PencilIcon, TrophyIcon, XMarkIcon } from "@heroicons/react/24/solid";
import type { User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function NicknameEditor(): React.JSX.Element | null {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auth observer
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data: d }) => setUser(d.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, s) => {
      setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Cargar nickname cuando hay usuario
  useEffect(() => {
    if (!user) return;
    void fetch("/api/profile")
      .then(async (r) => {
        if (r.ok) {
          const d = (await r.json()) as { displayName: string | null };
          setDisplayName(d.displayName);
        }
      });
  }, [user]);

  // Focus en input al abrir
  useEffect(() => {
    if (editing) {
      setDraft(displayName ?? "");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editing, displayName]);

  // No mostrar si no hay usuario o todavía está cargando
  if (!user) return null;

  const handleSave = async () => {
    if (saving) return;
    const trimmed = draft.trim();
    if (trimmed === (displayName ?? "")) { setEditing(false); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: trimmed }),
      });
      const data = (await res.json()) as { displayName?: string; error?: string };
      if (!res.ok) { setError(data.error ?? "Error al guardar"); return; }
      setDisplayName(data.displayName ?? trimmed);
      setEditing(false);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d8d2b4] bg-[linear-gradient(145deg,#fffdf5,#f4f8ec)] px-4 py-3 shadow-sm">
      {/* Izquierda: nombre */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-lg">👤</span>
        {editing ? (
          <div className="flex flex-col gap-1">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSave();
                if (e.key === "Escape") setEditing(false);
              }}
              maxLength={30}
              placeholder="Tu nombre en el ranking"
              className="rounded-xl border border-[#c5dca0] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--ink-900)] outline-none ring-0 focus:border-[#4e6f2a] focus:ring-2 focus:ring-[#4e6f2a]/20 w-52 sm:w-64"
            />
            {error ? <p className="text-xs text-red-500">{error}</p> : null}
          </div>
        ) : (
          <div className="min-w-0">
            <p className="text-xs text-[#7a9050]">Tu nombre en el ranking</p>
            <p className="font-semibold text-[var(--ink-900)] truncate">
              {displayName ?? <span className="text-[var(--ink-400)] font-normal italic">Sin nombre</span>}
            </p>
          </div>
        )}
      </div>

      {/* Derecha: acciones */}
      <div className="flex items-center gap-2 shrink-0">
        {editing ? (
          <>
            <button
              onClick={() => void handleSave()}
              disabled={saving || draft.trim().length < 3}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4e6f2a] text-white transition hover:bg-[#3d5720] disabled:opacity-40"
              title="Guardar"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--surface-100)] text-[var(--ink-500)] transition hover:bg-[var(--surface-200)]"
              title="Cancelar"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-[#d8d2b4] text-[var(--ink-500)] transition hover:border-[#4e6f2a] hover:text-[#4e6f2a]"
              title="Editar nombre"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </button>
            <Link
              href="/ranking"
              className="flex items-center gap-1.5 rounded-xl border border-[#d8d2b4] bg-white px-3 py-1.5 text-xs font-semibold text-[#4e6f2a] transition hover:border-[#4e6f2a] hover:bg-[#f4f8ec]"
            >
              <TrophyIcon className="h-3.5 w-3.5 text-[#f0c020]" /> Ver ranking
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

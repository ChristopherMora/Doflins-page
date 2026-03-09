"use client";

import { useEffect, useState } from "react";
import { CheckCircleIcon, PlusCircleIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function MarkOwnedButton({ doflinId }: { doflinId: number }): React.JSX.Element | null {
  // null = loading / not logged in, true/false = owned state
  const [owned, setOwned] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return; // not logged in — hide button
      const res = await fetch("/api/collection/user");
      if (res.ok) {
        const json = (await res.json()) as { ownedIds: number[] };
        setOwned(json.ownedIds.includes(doflinId));
      }
    });
  }, [doflinId]);

  const toggle = async () => {
    if (owned === null) return;
    setLoading(true);
    const next = !owned;
    setOwned(next);
    try {
      await fetch("/api/collection/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doflinId, owned: next }),
      });
      toast.success(
        next ? "¡Figura añadida a tu colección! 🎴" : "Figura eliminada de tu colección",
      );
    } catch {
      // revert optimistic update on error
      setOwned(owned);
      toast.error("No se pudo actualizar tu colección");
    } finally {
      setLoading(false);
    }
  };

  if (owned === null) return null;

  return (
    <button
      onClick={() => void toggle()}
      disabled={loading}
      className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all active:scale-95 disabled:opacity-70 ${
        owned
          ? "border border-[#b8d890] bg-[#eaf5d8] text-[#4e6f2a]"
          : "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] text-white shadow-md hover:opacity-90"
      }`}
    >
      {owned ? (
        <CheckCircleIcon className="h-4 w-4" />
      ) : (
        <PlusCircleIcon className="h-4 w-4" />
      )}
      {owned ? "En mi colección ✓" : "Agregar a mi colección"}
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LinkIcon, ListBulletIcon, Squares2X2Icon } from "@heroicons/react/24/solid";
import { toast } from "sonner";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { MyCollection } from "@/components/collection/my-collection";
import type { CollectionItemDTO } from "@/lib/types/doflin";

const PaniniAlbum = dynamic(
  () => import("@/components/collection/panini-album").then((m) => m.PaniniAlbum),
  { ssr: false, loading: () => <div className="flex min-h-[300px] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d8d2b4] border-t-[#4e6f2a]" /></div> },
);

const WantListManager = dynamic(
  () => import("@/components/collection/want-list-manager").then((m) => m.WantListManager),
  { ssr: false },
);

export function ColeccionShell({ initialDoflins }: { initialDoflins?: CollectionItemDTO[] }): React.JSX.Element {
  const [view, setView] = useState<"lista" | "album">("lista");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const shareCollection = async () => {
    if (!userId) return;
    const url = `${window.location.origin}/coleccion/${userId}`;
    if (navigator.share) {
      await navigator.share({ title: "Mi colección DOFLINS", url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("¡Enlace copiado!", { description: "Compártelo con quien quieras" });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tab switcher */}
        <div className="flex rounded-2xl border border-[#d8d2b4] bg-white p-1 gap-1 w-fit shadow-sm">
        <button
          onClick={() => setView("lista")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            view === "lista"
              ? "bg-[#4e6f2a] text-white shadow-sm"
              : "text-[#5a6650] hover:bg-[#f4f6e8]"
          }`}
        >
          <ListBulletIcon className="h-4 w-4" />
          Mi Colección
        </button>
        <button
          onClick={() => setView("album")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            view === "album"
              ? "bg-[#4e6f2a] text-white shadow-sm"
              : "text-[#5a6650] hover:bg-[#f4f6e8]"
          }`}
        >
          <Squares2X2Icon className="h-4 w-4" />
          Álbum
        </button>
        </div>

        {/* Share button */}
        {userId ? (
          <button
            onClick={() => void shareCollection()}
            className="flex items-center gap-1.5 rounded-xl border border-[#d8d2b4] bg-white px-3 py-2 text-xs font-semibold text-[#4e6f2a] shadow-sm transition hover:bg-[#f4f6e8]"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Compartir mi colección
          </button>
        ) : null}
      </div>

      {/* View content */}
      {view === "lista" ? (
        <MyCollection initialDoflins={initialDoflins} />
      ) : (
        <PaniniAlbum initialDoflins={initialDoflins} />
      )}

      {/* Want List */}
      {userId && (
        <div className="rounded-2xl border border-[#d8d2b4] bg-white p-4 sm:p-6 mt-6">
          <WantListManager isOwner={true} />
        </div>
      )}
    </div>
  );
}

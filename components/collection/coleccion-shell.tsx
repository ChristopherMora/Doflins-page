"use client";

import { useState } from "react";
import { ListBulletIcon, Squares2X2Icon } from "@heroicons/react/24/solid";

import { MyCollection } from "@/components/collection/my-collection";
import { PaniniAlbum } from "@/components/collection/panini-album";

export function ColeccionShell(): React.JSX.Element {
  const [view, setView] = useState<"lista" | "album">("lista");

  return (
    <div className="space-y-5">
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

      {/* View content */}
      {view === "lista" ? (
        <MyCollection />
      ) : (
        <PaniniAlbum />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowsRightLeftIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";

interface DoflinInfo {
  id: number;
  nombre: string;
  imagenUrl: string;
  rareza: string;
}

interface CollectionCompareProps {
  targetUserId: string;
  allDoflins: DoflinInfo[];
  targetOwnedIds: number[];
}

const RARITY_BADGE: Record<string, string> = {
  COMMON: "bg-[#e8edd8] text-[#3d5a2a]",
  RARE: "bg-[#dbe4ff] text-[#24336c]",
  EPIC: "bg-[#f0dbff] text-[#5a1a8a]",
  LEGENDARY: "bg-[#ffe9b5] text-[#5e4300]",
  ULTRA: "bg-[#fde8e8] text-[#8a2020]",
  MYTHIC: "bg-[#ffd6f5] text-[#6b006b]",
};

export function CollectionCompare({
  targetUserId: _targetUserId,
  allDoflins,
  targetOwnedIds,
}: CollectionCompareProps): React.JSX.Element | null {
  const [myOwnedIds, setMyOwnedIds] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<"youHave" | "theyHave" | null>(null);

  useEffect(() => {
    fetch("/api/collection/user")
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as { ownedIds?: number[] };
          setMyOwnedIds(data.ownedIds ?? []);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  // No autenticado o cargando
  if (loading) {
    return (
      <div className="rounded-2xl border border-[#d8d2b4] bg-white p-6">
        <div className="h-24 animate-pulse rounded-xl bg-[var(--surface-100)]" />
      </div>
    );
  }

  if (!myOwnedIds) {
    return null; // Usuario no autenticado, no mostramos comparación
  }

  const targetSet = new Set(targetOwnedIds);
  const mySet = new Set(myOwnedIds);

  // Figuras que tú tienes y el otro no
  const youHaveTheyDont = myOwnedIds.filter((id) => !targetSet.has(id));
  // Figuras que el otro tiene y tú no
  const theyHaveYouDont = targetOwnedIds.filter((id) => !mySet.has(id));
  // Figuras que ambos tienen
  const bothHave = myOwnedIds.filter((id) => targetSet.has(id));

  const getDoflinById = (id: number) => allDoflins.find((d) => d.id === id);

  if (youHaveTheyDont.length === 0 && theyHaveYouDont.length === 0) {
    return (
      <div className="rounded-2xl border border-[#d8d2b4] bg-white p-6 text-center">
        <ArrowsRightLeftIcon className="mx-auto h-8 w-8 text-[var(--ink-400)]" />
        <p className="mt-2 text-sm text-[var(--ink-600)]">
          Tienen exactamente las mismas figuras. ¡No hay intercambios posibles!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#d8d2b4] bg-white p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ArrowsRightLeftIcon className="h-5 w-5 text-[#4e6f2a]" />
        <h2 className="font-semibold text-[var(--ink-900)]">Comparación de colección</h2>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-[#e8f5e0] p-3">
          <p className="text-2xl font-bold text-[#4e6f2a]">{youHaveTheyDont.length}</p>
          <p className="text-xs text-[#4e6f2a]">Puedes ofrecer</p>
        </div>
        <div className="rounded-xl bg-[#fef3c7] p-3">
          <p className="text-2xl font-bold text-[#92400e]">{bothHave.length}</p>
          <p className="text-xs text-[#92400e]">En común</p>
        </div>
        <div className="rounded-xl bg-[#e0e7ff] p-3">
          <p className="text-2xl font-bold text-[#3730a3]">{theyHaveYouDont.length}</p>
          <p className="text-xs text-[#3730a3]">Te interesan</p>
        </div>
      </div>

      {/* Sección expandible: Puedes ofrecer */}
      {youHaveTheyDont.length > 0 && (
        <div className="rounded-xl border border-[#c6eec0] bg-[#f0faf0]">
          <button
            onClick={() => setExpanded(expanded === "youHave" ? null : "youHave")}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <span className="text-sm font-semibold text-[#4e6f2a]">
              Figuras que puedes ofrecer ({youHaveTheyDont.length})
            </span>
            {expanded === "youHave" ? (
              <ChevronUpIcon className="h-5 w-5 text-[#4e6f2a]" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-[#4e6f2a]" />
            )}
          </button>
          {expanded === "youHave" && (
            <div className="border-t border-[#c6eec0] p-4 pt-3">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {youHaveTheyDont.slice(0, 18).map((id) => {
                  const doflin = getDoflinById(id);
                  if (!doflin) return null;
                  return (
                    <div
                      key={id}
                      className="relative aspect-square overflow-hidden rounded-lg border border-[#c6eec0]"
                    >
                      <Image
                        src={doflin.imagenUrl}
                        alt={doflin.nombre}
                        fill
                        className="object-cover"
                        sizes="60px"
                      />
                      <span
                        className={`absolute bottom-0.5 right-0.5 rounded px-1 text-[8px] font-bold ${RARITY_BADGE[doflin.rareza] ?? "bg-gray-100"}`}
                      >
                        {doflin.rareza[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
              {youHaveTheyDont.length > 18 && (
                <p className="mt-2 text-center text-xs text-[var(--ink-500)]">
                  +{youHaveTheyDont.length - 18} más
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sección expandible: Te interesan */}
      {theyHaveYouDont.length > 0 && (
        <div className="rounded-xl border border-[#c4d8f5] bg-[#f0f5fd]">
          <button
            onClick={() => setExpanded(expanded === "theyHave" ? null : "theyHave")}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <span className="text-sm font-semibold text-[#3730a3]">
              Figuras que te pueden interesar ({theyHaveYouDont.length})
            </span>
            {expanded === "theyHave" ? (
              <ChevronUpIcon className="h-5 w-5 text-[#3730a3]" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-[#3730a3]" />
            )}
          </button>
          {expanded === "theyHave" && (
            <div className="border-t border-[#c4d8f5] p-4 pt-3">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {theyHaveYouDont.slice(0, 18).map((id) => {
                  const doflin = getDoflinById(id);
                  if (!doflin) return null;
                  return (
                    <div
                      key={id}
                      className="relative aspect-square overflow-hidden rounded-lg border border-[#c4d8f5]"
                    >
                      <Image
                        src={doflin.imagenUrl}
                        alt={doflin.nombre}
                        fill
                        className="object-cover"
                        sizes="60px"
                      />
                      <span
                        className={`absolute bottom-0.5 right-0.5 rounded px-1 text-[8px] font-bold ${RARITY_BADGE[doflin.rareza] ?? "bg-gray-100"}`}
                      >
                        {doflin.rareza[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
              {theyHaveYouDont.length > 18 && (
                <p className="mt-2 text-center text-xs text-[var(--ink-500)]">
                  +{theyHaveYouDont.length - 18} más
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface WantListItem {
  id: number;
  doflinId: number;
  priority: "low" | "medium" | "high";
  notes: string | null;
  isPublic: boolean;
  createdAt: string;
  doflin: {
    id: number;
    nombre: string;
    imagenUrl: string;
    rareza: string;
    serie: string;
  };
}

interface Doflin {
  id: number;
  nombre: string;
  imagenUrl: string;
  rareza: string;
  serie: string;
}

const PRIORITY_CONFIG = {
  low: { label: "Bajo", color: "bg-slate-100 text-slate-600", icon: null },
  medium: { label: "Medio", color: "bg-amber-100 text-amber-700", icon: StarIcon },
  high: { label: "Alto", color: "bg-rose-100 text-rose-700", icon: HeartIcon },
};

const RARITY_ORDER = ["MYTHIC", "ULTRA", "LEGENDARY", "EPIC", "RARE", "COMMON"];

interface WantListManagerProps {
  isOwner?: boolean;
  userId?: string;
}

export function WantListManager({ isOwner = true, userId }: WantListManagerProps) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [items, setItems] = useState<WantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableFigures, setAvailableFigures] = useState<Doflin[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Auth state
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data: d }) => setUser(d.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchWantList = useCallback(async () => {
    try {
      const endpoint = isOwner ? "/api/want-list" : `/api/want-list/${userId}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Error fetching want list");
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      console.error("Error loading want list");
    } finally {
      setLoading(false);
    }
  }, [isOwner, userId]);

  useEffect(() => {
    if (user !== undefined || !isOwner) {
      fetchWantList();
    }
  }, [fetchWantList, user, isOwner]);

  const fetchAvailableFigures = async () => {
    try {
      const res = await fetch("/api/collection?universe=all");
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      // Filter out figures already in want list
      const wantListIds = new Set(items.map((i) => i.doflinId));
      setAvailableFigures(
        (data.figuras || []).filter((f: Doflin) => !wantListIds.has(f.id))
      );
    } catch {
      console.error("Error loading figures");
    }
  };

  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    await fetchAvailableFigures();
  };

  const handleAddToWantList = async (doflinId: number, priority: "low" | "medium" | "high" = "medium") => {
    try {
      const res = await fetch("/api/want-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doflinId, priority }),
      });
      if (!res.ok) throw new Error("Error");
      await fetchWantList();
      setAvailableFigures((prev) => prev.filter((f) => f.id !== doflinId));
    } catch {
      console.error("Error adding to want list");
    }
  };

  const handleRemoveFromWantList = async (doflinId: number) => {
    try {
      const res = await fetch(`/api/want-list?doflinId=${doflinId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error");
      setItems((prev) => prev.filter((i) => i.doflinId !== doflinId));
    } catch {
      console.error("Error removing from want list");
    }
  };

  const handleTogglePublic = async (doflinId: number, currentPublic: boolean) => {
    try {
      const res = await fetch("/api/want-list", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doflinId, isPublic: !currentPublic }),
      });
      if (!res.ok) throw new Error("Error");
      setItems((prev) =>
        prev.map((i) =>
          i.doflinId === doflinId ? { ...i, isPublic: !currentPublic } : i
        )
      );
    } catch {
      console.error("Error updating visibility");
    }
  };

  const filteredFigures = availableFigures
    .filter((f) =>
      f.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.serie.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => RARITY_ORDER.indexOf(a.rareza) - RARITY_ORDER.indexOf(b.rareza));

  if (loading || user === undefined) {
    return (
      <div className="animate-pulse bg-slate-100 rounded-xl h-48" />
    );
  }

  if (!isOwner && items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        Este usuario no tiene figuras en su lista pública.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartIcon className="w-5 h-5 text-rose-500" />
          <h3 className="font-semibold text-slate-800">
            {isOwner ? "Mi Want List" : "Want List"}
          </h3>
          <span className="text-sm text-slate-500">({items.length})</span>
        </div>
        {isOwner && user && (
          <Button size="sm" variant="ghost" onClick={handleOpenAddModal}>
            <PlusIcon className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        )}
      </div>

      {/* Items grid */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl">
          <HeartOutline className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p>No tienes figuras en tu want list.</p>
          {isOwner && user && (
            <Button
              size="sm"
              variant="ghost"
              className="mt-2"
              onClick={handleOpenAddModal}
            >
              Agregar figuras
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item) => {
            const priorityConfig = PRIORITY_CONFIG[item.priority];
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-white rounded-xl border border-slate-200 overflow-hidden group"
              >
                {/* Priority badge */}
                {item.priority !== "low" && (
                  <div
                    className={cn(
                      "absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-1",
                      priorityConfig.color
                    )}
                  >
                    {priorityConfig.icon && <priorityConfig.icon className="w-3 h-3" />}
                    {priorityConfig.label}
                  </div>
                )}

                {/* Public/Private indicator for owner */}
                {isOwner && (
                  <button
                    onClick={() => handleTogglePublic(item.doflinId, item.isPublic)}
                    className={cn(
                      "absolute top-2 right-2 z-10 p-1 rounded-full text-xs",
                      item.isPublic
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-slate-100 text-slate-400"
                    )}
                    title={item.isPublic ? "Público" : "Privado"}
                  >
                    {item.isPublic ? "👁" : "🔒"}
                  </button>
                )}

                {/* Image */}
                <div className="relative aspect-square p-2">
                  <Image
                    src={item.doflin.imagenUrl}
                    alt={item.doflin.nombre}
                    fill
                    className="object-contain"
                    sizes="150px"
                  />
                </div>

                {/* Info */}
                <div className="p-2 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {item.doflin.nombre}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {item.doflin.serie}
                  </p>
                </div>

                {/* Delete button on hover */}
                {isOwner && (
                  <button
                    onClick={() => handleRemoveFromWantList(item.doflinId)}
                    className="absolute bottom-2 right-2 p-1.5 rounded-full bg-rose-100 text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Quitar de want list"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-lg">Agregar a Want List</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-full"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b">
                <input
                  type="text"
                  placeholder="Buscar figura..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Figures list */}
              <div className="p-4 overflow-y-auto max-h-[50vh]">
                {filteredFigures.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">
                    No hay figuras disponibles
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredFigures.slice(0, 20).map((figure) => (
                      <button
                        key={figure.id}
                        onClick={() => handleAddToWantList(figure.id)}
                        className="flex items-center gap-3 p-2 rounded-lg border hover:border-amber-500 hover:bg-amber-50 transition-colors text-left"
                      >
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <Image
                            src={figure.imagenUrl}
                            alt={figure.nombre}
                            fill
                            className="object-contain"
                            sizes="48px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {figure.nombre}
                          </p>
                          <p className="text-xs text-slate-500">
                            {figure.rareza}
                          </p>
                        </div>
                        <PlusIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

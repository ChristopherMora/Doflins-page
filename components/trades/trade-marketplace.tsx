"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { PlusIcon, ArrowsRightLeftIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";

interface TradeListing {
  id: number;
  supabaseUserId: string;
  offeringDoflinId: number;
  offeringNombre: string;
  offeringImagenUrl: string;
  offeringRareza: string;
  wantingDoflinId: number | null;
  wantingNombre: string | null;
  wantingImagenUrl: string | null;
  wantingRareza: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

interface CollectionItem {
  id: number;
  nombre: string;
  imagenUrl: string;
  rareza: string;
}

const RARITY_BADGE: Record<string, string> = {
  COMMON: "bg-[#e8edd8] text-[#3d5a2a]",
  RARE: "bg-[#dbe4ff] text-[#24336c]",
  EPIC: "bg-[#f0dbff] text-[#5a1a8a]",
  LEGENDARY: "bg-[#ffe9b5] text-[#5e4300]",
  ULTRA: "bg-[#fde8e8] text-[#8a2020]",
  MYTHIC: "bg-[#ffd6f5] text-[#6b006b]",
};

export function TradeMarketplace(): React.JSX.Element {
  const [listings, setListings] = useState<TradeListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [myCollection, setMyCollection] = useState<CollectionItem[]>([]);
  const [creatingListing, setCreatingListing] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null);
  const [selectedWant, setSelectedWant] = useState<number | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await fetch("/api/trades");
      if (res.ok) {
        const data = (await res.json()) as { listings: TradeListing[] };
        setListings(data.listings);
      }
    } catch {
      toast.error("Error al cargar intercambios");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCollection = async () => {
    try {
      const res = await fetch("/api/collection/user");
      if (res.ok) {
        const data = (await res.json()) as { doflins: CollectionItem[]; ownedIds: number[] };
        // Filter only owned doflins
        const owned = (data.doflins ?? []).filter((d: CollectionItem & { owned?: boolean }) => 
          data.ownedIds?.includes(d.id)
        );
        setMyCollection(owned);
      }
    } catch {
      console.error("Failed to fetch collection");
    }
  };

  const openCreateModal = async () => {
    await fetchMyCollection();
    setShowCreateModal(true);
    setSelectedOffer(null);
    setSelectedWant(null);
  };

  const createListing = async () => {
    if (!selectedOffer) {
      toast.error("Selecciona una figura para ofrecer");
      return;
    }

    setCreatingListing(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offeringDoflinId: selectedOffer,
          wantingDoflinId: selectedWant,
        }),
      });

      if (res.ok) {
        toast.success("¡Intercambio publicado!");
        setShowCreateModal(false);
        fetchListings();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al crear intercambio");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setCreatingListing(false);
    }
  };

  const makeOffer = async (listingId: number, offeredDoflinId: number) => {
    try {
      const res = await fetch(`/api/trades/${listingId}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offeredDoflinId }),
      });

      if (res.ok) {
        toast.success("¡Oferta enviada!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al enviar oferta");
      }
    } catch {
      toast.error("Error de conexión");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-[var(--surface-100)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create button */}
      <button
        onClick={() => void openCreateModal()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--surface-300)] bg-[var(--surface-50)] px-4 py-4 text-sm font-medium text-[var(--ink-600)] transition hover:border-[#4e6f2a] hover:bg-[#f5f9e8] hover:text-[#4e6f2a]"
      >
        <PlusIcon className="h-5 w-5" />
        Publicar un intercambio
      </button>

      {/* Listings */}
      {listings.length === 0 ? (
        <div className="rounded-xl border border-[var(--surface-200)] bg-[var(--background)] px-6 py-10 text-center">
          <ArrowsRightLeftIcon className="mx-auto h-10 w-10 text-[var(--ink-300)]" />
          <p className="mt-3 text-sm text-[var(--ink-500)]">
            No hay intercambios disponibles todavía.
          </p>
          <p className="mt-1 text-xs text-[var(--ink-400)]">
            ¡Sé el primero en publicar uno!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <TradeCard
              key={listing.id}
              listing={listing}
              myCollection={myCollection}
              onMakeOffer={makeOffer}
              onFetchCollection={fetchMyCollection}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-[var(--ink-900)]">Publicar intercambio</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-1 text-[var(--ink-500)] hover:bg-[var(--surface-100)]"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Offer selection */}
              <div>
                <p className="mb-2 text-sm font-medium text-[var(--ink-700)]">Quiero ofrecer:</p>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {myCollection.map((doflin) => (
                    <button
                      key={doflin.id}
                      onClick={() => setSelectedOffer(doflin.id)}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                        selectedOffer === doflin.id
                          ? "border-[#4e6f2a] ring-2 ring-[#4e6f2a]/30"
                          : "border-[var(--surface-200)]"
                      }`}
                    >
                      <Image
                        src={doflin.imagenUrl}
                        alt={doflin.nombre}
                        fill
                        className="object-cover"
                        sizes="60px"
                      />
                    </button>
                  ))}
                </div>
                {selectedOffer && (
                  <p className="mt-1 text-xs text-[#4e6f2a]">
                    {myCollection.find((d) => d.id === selectedOffer)?.nombre}
                  </p>
                )}
              </div>

              {/* Want selection (optional) */}
              <div>
                <p className="mb-2 text-sm font-medium text-[var(--ink-700)]">
                  A cambio de (opcional):
                </p>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  <button
                    onClick={() => setSelectedWant(null)}
                    className={`flex aspect-square items-center justify-center rounded-lg border-2 text-xs transition ${
                      selectedWant === null
                        ? "border-[#4e6f2a] bg-[#f5f9e8] text-[#4e6f2a]"
                        : "border-[var(--surface-200)] text-[var(--ink-400)]"
                    }`}
                  >
                    Cualquiera
                  </button>
                  {myCollection.map((doflin) => (
                    <button
                      key={doflin.id}
                      onClick={() => setSelectedWant(doflin.id)}
                      disabled={doflin.id === selectedOffer}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                        selectedWant === doflin.id
                          ? "border-[#4e6f2a] ring-2 ring-[#4e6f2a]/30"
                          : "border-[var(--surface-200)]"
                      } ${doflin.id === selectedOffer ? "opacity-30" : ""}`}
                    >
                      <Image
                        src={doflin.imagenUrl}
                        alt={doflin.nombre}
                        fill
                        className="object-cover"
                        sizes="60px"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => void createListing()}
                disabled={!selectedOffer || creatingListing}
                className="w-full rounded-xl bg-[#4e6f2a] py-3 text-sm font-semibold text-white transition hover:bg-[#3d5a22] disabled:opacity-50"
              >
                {creatingListing ? "Publicando..." : "Publicar intercambio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TradeCardProps {
  listing: TradeListing;
  myCollection: CollectionItem[];
  onMakeOffer: (listingId: number, offeredDoflinId: number) => Promise<void>;
  onFetchCollection: () => Promise<void>;
}

function TradeCard({
  listing,
  myCollection,
  onMakeOffer,
  onFetchCollection,
}: TradeCardProps) {
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedDoflin, setSelectedDoflin] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  const handleOpenOffer = async () => {
    await onFetchCollection();
    setShowOfferModal(true);
  };

  const handleSendOffer = async () => {
    if (!selectedDoflin) return;
    setSending(true);
    await onMakeOffer(listing.id, selectedDoflin);
    setSending(false);
    setShowOfferModal(false);
    setSelectedDoflin(null);
  };

  return (
    <>
      <div className="rounded-xl border border-[var(--surface-200)] bg-[var(--background)] p-4">
        <div className="flex items-center gap-4">
          {/* Offering */}
          <div className="flex flex-col items-center">
            <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-[var(--surface-200)]">
              <Image
                src={listing.offeringImagenUrl}
                alt={listing.offeringNombre}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <span
              className={`mt-1 rounded px-1.5 text-[10px] font-semibold ${RARITY_BADGE[listing.offeringRareza] ?? "bg-gray-100"}`}
            >
              {listing.offeringNombre}
            </span>
          </div>

          {/* Arrow */}
          <ArrowsRightLeftIcon className="h-5 w-5 shrink-0 text-[var(--ink-400)]" />

          {/* Wanting */}
          <div className="flex flex-col items-center">
            {listing.wantingImagenUrl ? (
              <>
                <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-[var(--surface-200)]">
                  <Image
                    src={listing.wantingImagenUrl}
                    alt={listing.wantingNombre ?? ""}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <span
                  className={`mt-1 rounded px-1.5 text-[10px] font-semibold ${RARITY_BADGE[listing.wantingRareza ?? "COMMON"] ?? "bg-gray-100"}`}
                >
                  {listing.wantingNombre}
                </span>
              </>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-[var(--surface-300)] bg-[var(--surface-50)]">
                <span className="text-xs text-[var(--ink-400)]">?</span>
              </div>
            )}
          </div>

          {/* Make offer button */}
          <div className="ml-auto">
            <button
              onClick={() => void handleOpenOffer()}
              className="rounded-lg bg-[#4e6f2a] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#3d5a22]"
            >
              Ofrecer
            </button>
          </div>
        </div>

        {listing.notes && (
          <p className="mt-2 text-xs text-[var(--ink-500)] italic">
            &ldquo;{listing.notes}&rdquo;
          </p>
        )}
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-[var(--ink-900)]">Hacer una oferta</h3>
              <button
                onClick={() => setShowOfferModal(false)}
                className="rounded-full p-1 text-[var(--ink-500)] hover:bg-[var(--surface-100)]"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-3 text-sm text-[var(--ink-600)]">
              Selecciona la figura que quieres ofrecer a cambio de{" "}
              <strong>{listing.offeringNombre}</strong>:
            </p>

            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {myCollection.map((doflin) => (
                <button
                  key={doflin.id}
                  onClick={() => setSelectedDoflin(doflin.id)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                    selectedDoflin === doflin.id
                      ? "border-[#4e6f2a] ring-2 ring-[#4e6f2a]/30"
                      : "border-[var(--surface-200)]"
                  }`}
                >
                  <Image
                    src={doflin.imagenUrl}
                    alt={doflin.nombre}
                    fill
                    className="object-cover"
                    sizes="60px"
                  />
                </button>
              ))}
            </div>

            {myCollection.length === 0 && (
              <p className="text-center text-sm text-[var(--ink-400)]">
                No tienes figuras para intercambiar
              </p>
            )}

            <button
              onClick={() => void handleSendOffer()}
              disabled={!selectedDoflin || sending}
              className="mt-4 w-full rounded-xl bg-[#4e6f2a] py-3 text-sm font-semibold text-white transition hover:bg-[#3d5a22] disabled:opacity-50"
            >
              {sending ? "Enviando..." : "Enviar oferta"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

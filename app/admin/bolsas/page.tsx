"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  QrCodeIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { QRCodeSVG } from "qrcode.react";

const RARITY_LABELS: Record<string, string> = {
  COMMON: "Común",
  RARE: "Raro",
  EPIC: "Épico",
  LEGENDARY: "Legendario",
  ULTRA: "Ultra",
  MYTHIC: "Mítico",
};
const RARITY_COLORS: Record<string, string> = {
  COMMON: "#7a8070",
  RARE: "#2e7a4e",
  EPIC: "#b46a2d",
  LEGENDARY: "#e0a845",
  ULTRA: "#c0392b",
  MYTHIC: "#9b5de5",
};

interface DoflinOption {
  id: number;
  nombre: string;
  modeloBase: string;
  variante: string;
  serie: string;
  rareza: string;
  imagenUrl: string;
}

interface BagItem {
  id: number;
  nombre: string;
  rareza: string;
  imagenUrl: string;
}

interface BagRow {
  id: number;
  codigo: string;
  packSize: number;
  usado: boolean;
  scanCount: number;
  status: "active" | "blocked";
  createdAt: string;
  items: BagItem[];
}

export default function AdminBolsasPage() {
  const [bags, setBags] = useState<BagRow[]>([]);
  const [allDoflins, setAllDoflins] = useState<DoflinOption[]>([]);
  const [loadingBags, setLoadingBags] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Formulario
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [packSize, setPackSize] = useState(1);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdBag, setCreatedBag] = useState<{ codigo: string; doflinCount: number } | null>(null);
  const [doflinSearch, setDoflinSearch] = useState("");

  // QR grande temporal
  const [qrBig, setQrBig] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const BASE_URL =
    typeof window !== "undefined" ? window.location.origin : "https://doflins.dofer.mx";

  useEffect(() => {
    void (async () => {
      const [bagsRes, doflinsRes] = await Promise.all([
        fetch("/api/admin/bolsas"),
        fetch("/api/admin/doflins"),
      ]);
      if (bagsRes.ok) {
        const data = (await bagsRes.json()) as { bags: BagRow[] };
        setBags(data.bags);
      }
      if (doflinsRes.ok) {
        const data = (await doflinsRes.json()) as { doflins: DoflinOption[] };
        setAllDoflins(data.doflins);
      }
      setLoadingBags(false);
    })();
  }, []);

  const toggleDoflin = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleCreate = async () => {
    if (selectedIds.length === 0) return;
    setCreating(true);
    setCreateError(null);

    const res = await fetch("/api/admin/bolsas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doflinIds: selectedIds, packSize }),
    });

    const data = (await res.json()) as {
      success?: boolean;
      bag?: { codigo: string; doflinCount: number };
      error?: string;
    };

    if (res.ok && data.bag) {
      setCreatedBag(data.bag);
      setSelectedIds([]);
      setPackSize(1);
      setShowCreateForm(false);
      // Recargar lista
      const bagsRes = await fetch("/api/admin/bolsas");
      if (bagsRes.ok) {
        const d = (await bagsRes.json()) as { bags: BagRow[] };
        setBags(d.bags);
      }
    } else {
      setCreateError(data.error ?? "Error desconocido");
    }
    setCreating(false);
  };

  const filteredDoflins = allDoflins.filter(
    (d) =>
      d.nombre.toLowerCase().includes(doflinSearch.toLowerCase()) ||
      d.modeloBase.toLowerCase().includes(doflinSearch.toLowerCase()) ||
      d.serie.toLowerCase().includes(doflinSearch.toLowerCase()),
  );

  return (
    <main className="min-h-screen px-4 py-10 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink-900)]">Bolsas de figuras</h1>
          <p className="text-sm text-[var(--ink-500)] mt-0.5">
            Crea bolsas, asigna doflins y genera el QR para pegar en la bolsa física.
          </p>
        </div>
        <button
          onClick={() => { setShowCreateForm(true); setCreatedBag(null); }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#4e6f2a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#3d5720] transition-colors"
        >
          <PlusIcon className="h-4 w-4" /> Nueva bolsa
        </button>
      </div>

      {/* Bolsa creada — alerta éxito + QR */}
      {createdBag ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 flex flex-col sm:flex-row gap-6 items-start">
          <div className="shrink-0 bg-white p-3 rounded-xl shadow-sm">
            <QRCodeSVG
              value={`${BASE_URL}/bolsa/${createdBag.codigo}`}
              size={140}
              level="M"
              includeMargin={false}
            />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <p className="font-bold text-green-800">¡Bolsa creada!</p>
            </div>
            <p className="text-sm text-green-700">
              Código: <code className="font-mono font-bold text-lg text-green-900">{createdBag.codigo}</code>
            </p>
            <p className="text-xs text-green-600">{createdBag.doflinCount} doflins asignados</p>
            <a
              href={`${BASE_URL}/bolsa/${createdBag.codigo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-green-700 underline"
            >
              Ver página pública →
            </a>
            <div className="flex gap-2 pt-1 flex-wrap">
              <button
                onClick={() => setQrBig(createdBag.codigo)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800 transition-colors"
              >
                <QrCodeIcon className="h-3.5 w-3.5" /> Ver QR grande
              </button>
              <button
                onClick={() => setCreatedBag(null)}
                className="rounded-lg border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Formulario crear bolsa */}
      {showCreateForm ? (
        <div className="rounded-2xl border border-[var(--surface-200)] bg-white shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-[var(--surface-100)]">
            <h2 className="font-bold text-[var(--ink-900)]">Crear nueva bolsa</h2>
            <button onClick={() => setShowCreateForm(false)} className="rounded-full p-1.5 hover:bg-[var(--surface-100)] transition-colors">
              <XMarkIcon className="h-4 w-4 text-[var(--ink-500)]" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Pack size */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[var(--ink-500)] mb-2">
                Tamaño de bolsa
              </label>
              <div className="flex gap-2 flex-wrap">
                {[1, 5, 10, 15, 30].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPackSize(size)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold border transition-colors ${
                      packSize === size
                        ? "bg-[#4e6f2a] text-white border-[#4e6f2a]"
                        : "bg-white text-[var(--ink-700)] border-[var(--surface-200)] hover:border-[#4e6f2a]"
                    }`}
                  >
                    ×{size}
                  </button>
                ))}
              </div>
            </div>

            {/* Selección doflins */}
            <div>
              <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                <label className="text-xs font-bold uppercase tracking-wide text-[var(--ink-500)]">
                  Seleccionar doflins ({selectedIds.length} seleccionados)
                </label>
                {selectedIds.length > 0 ? (
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-xs text-[var(--ink-500)] hover:text-red-500 transition-colors"
                  >
                    Limpiar selección
                  </button>
                ) : null}
              </div>

              {/* Buscador */}
              <div className="relative mb-3">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--ink-400)]" />
                <input
                  type="text"
                  placeholder="Buscar doflin..."
                  value={doflinSearch}
                  onChange={(e) => setDoflinSearch(e.target.value)}
                  className="w-full rounded-xl border border-[var(--surface-200)] bg-[var(--surface-50)] pl-8 pr-3 py-2 text-sm text-[var(--ink-800)] placeholder:text-[var(--ink-400)] focus:outline-none focus:ring-2 focus:ring-[#4e6f2a]/30"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[360px] overflow-y-auto pr-0.5">
                {filteredDoflins.map((d) => {
                  const selected = selectedIds.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDoflin(d.id)}
                      className={`relative flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
                        selected
                          ? "border-[#4e6f2a] shadow-[0_0_0_2px_#4e6f2a33]"
                          : "border-[var(--surface-200)] hover:border-[var(--surface-300)]"
                      }`}
                    >
                      <div className="relative h-20 w-full overflow-hidden bg-[var(--surface-100)]">
                        {d.imagenUrl ? (
                          <Image
                            src={d.imagenUrl}
                            alt={d.nombre}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : null}
                        {selected ? (
                          <div className="absolute inset-0 bg-[#4e6f2a]/20 flex items-center justify-center">
                            <CheckCircleIcon className="h-7 w-7 text-[#4e6f2a] drop-shadow" />
                          </div>
                        ) : null}
                      </div>
                      <div className="px-2 py-1.5">
                        <p className="text-[11px] font-semibold text-[var(--ink-800)] truncate">{d.nombre}</p>
                        <p
                          className="text-[10px] font-bold"
                          style={{ color: RARITY_COLORS[d.rareza] ?? "#666" }}
                        >
                          {RARITY_LABELS[d.rareza] ?? d.rareza}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {createError ? (
              <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{createError}</p>
            ) : null}

            <button
              onClick={() => void handleCreate()}
              disabled={selectedIds.length === 0 || creating}
              className="w-full rounded-xl bg-[#4e6f2a] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#3d5720] disabled:opacity-40 transition-colors"
            >
              {creating
                ? "Creando..."
                : `Crear bolsa con ${selectedIds.length} doflins`}
            </button>
          </div>
        </div>
      ) : null}

      {/* Lista de bolsas */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--ink-500)]">
          Bolsas registradas ({bags.length})
        </h2>

        {loadingBags ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--surface-100)]" />
            ))}
          </div>
        ) : bags.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--surface-300)] p-8 text-center">
            <QrCodeIcon className="mx-auto mb-2 h-8 w-8 text-[var(--ink-300)]" />
            <p className="text-sm text-[var(--ink-500)]">No hay bolsas creadas aún.</p>
          </div>
        ) : (
          bags.map((bag) => (
            <BagCard key={bag.id} bag={bag} baseUrl={BASE_URL} onQrClick={setQrBig} />
          ))
        )}
      </div>

      {/* QR modal grande */}
      {qrBig ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setQrBig(null)}
        >
          <div
            className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--ink-400)]">
              Código QR — pegar en la bolsa
            </p>
            <QRCodeSVG
              value={`${BASE_URL}/bolsa/${qrBig}`}
              size={240}
              level="M"
              includeMargin={true}
            />
            <p className="font-mono font-bold text-xl text-[var(--ink-900)] tracking-widest">
              {qrBig}
            </p>
            <p className="text-xs text-[var(--ink-500)] max-w-[240px] text-center">
              {`${BASE_URL}/bolsa/${qrBig}`}
            </p>
            <button
              onClick={() => { window.print(); }}
              className="rounded-xl bg-[#4e6f2a] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#3d5720] transition-colors"
            >
              Imprimir
            </button>
            <button
              onClick={() => setQrBig(null)}
              className="text-xs text-[var(--ink-400)] hover:text-[var(--ink-700)] transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}

      <div ref={printRef} />
    </main>
  );
}

function BagCard({
  bag,
  baseUrl,
  onQrClick,
}: {
  bag: BagRow;
  baseUrl: string;
  onQrClick: (codigo: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--surface-200)] bg-white overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        {/* Mini QR */}
        <div
          className="shrink-0 cursor-pointer bg-white p-1.5 rounded-lg border border-[var(--surface-200)] shadow-sm hover:shadow-md transition-shadow"
          title="Ver QR grande"
          onClick={() => onQrClick(bag.codigo)}
        >
          <QRCodeSVG value={`${baseUrl}/bolsa/${bag.codigo}`} size={52} level="M" includeMargin={false} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="font-mono font-bold text-[#4e6f2a] text-base tracking-widest">
              {bag.codigo}
            </code>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                bag.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}
            >
              {bag.status === "active" ? "Activa" : "Bloqueada"}
            </span>
            {bag.usado ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                Escaneada
              </span>
            ) : null}
          </div>
          <p className="text-xs text-[var(--ink-500)] mt-0.5">
            {bag.items.length} doflins · ×{bag.packSize} pack · {bag.scanCount} scans
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`${baseUrl}/bolsa/${bag.codigo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[var(--surface-200)] px-3 py-1.5 text-xs font-medium text-[var(--ink-600)] hover:bg-[var(--surface-100)] transition-colors"
          >
            Ver
          </a>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded-lg border border-[var(--surface-200)] p-1.5 text-[var(--ink-400)] hover:bg-[var(--surface-100)] transition-colors"
          >
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {expanded && bag.items.length > 0 ? (
        <div className="border-t border-[var(--surface-100)] px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {bag.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-1.5 rounded-full border border-[var(--surface-200)] bg-[var(--surface-50)] pl-1 pr-3 py-1"
              >
                {item.imagenUrl ? (
                  <div className="h-6 w-6 rounded-full overflow-hidden shrink-0">
                    <Image src={item.imagenUrl} alt={item.nombre} width={24} height={24} className="object-cover" unoptimized />
                  </div>
                ) : null}
                <span className="text-xs font-medium text-[var(--ink-700)]">{item.nombre}</span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: RARITY_COLORS[item.rareza] ?? "#666" }}
                >
                  {RARITY_LABELS[item.rareza] ?? item.rareza}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

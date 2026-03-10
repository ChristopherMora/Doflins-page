"use client";

import { useEffect, useMemo, useState } from "react";

interface DoflinOption {
  id: number;
  nombre: string;
  rareza: string;
  serie: string;
}

type Tab = "generate" | "csv";

const PACK_SIZES = [5, 10, 15, 20, 30] as const;

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I para legibilidad

function generateCode(): string {
  return Array.from({ length: 10 }, () =>
    CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
  ).join("");
}

function generateUniqueCodes(count: number): string[] {
  const seen = new Set<string>();
  const codes: string[] = [];
  let attempts = 0;
  while (codes.length < count && attempts < count * 10) {
    attempts++;
    const c = generateCode();
    if (!seen.has(c)) {
      seen.add(c);
      codes.push(c);
    }
  }
  return codes;
}

export default function AdminCodigosPage() {
  const [tab, setTab] = useState<Tab>("generate");

  // ── Generator state ──────────────────────────────────────────────────────
  const [doflins, setDoflins] = useState<DoflinOption[]>([]);
  const [loadingDoflins, setLoadingDoflins] = useState(true);
  const [selectedDoflinId, setSelectedDoflinId] = useState<number | null>(null);
  const [selectedDoflinName, setSelectedDoflinName] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [packSize, setPackSize] = useState<(typeof PACK_SIZES)[number]>(5);
  const [preview, setPreview] = useState<string[]>([]);
  const [genStatus, setGenStatus] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [doflinSearch, setDoflinSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // ── CSV state ─────────────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [csvStatus, setCsvStatus] = useState<string | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/doflins", { cache: "no-store" })
      .then((r) => r.json())
      .then(
        (data: {
          items?: {
            id: number;
            name: string;
            rarity: string;
            series: string;
          }[];
        }) => {
          setDoflins(
            (data.items ?? []).map((d) => ({
              id: d.id,
              nombre: d.name,
              rareza: d.rarity,
              serie: d.series,
            })),
          );
        },
      )
      .catch(() => {})
      .finally(() => setLoadingDoflins(false));
  }, []);

  const filteredDoflins = useMemo(() => {
    if (!doflinSearch.trim()) return doflins;
    const q = doflinSearch.toLowerCase();
    return doflins.filter(
      (d) =>
        d.nombre.toLowerCase().includes(q) ||
        d.serie.toLowerCase().includes(q),
    );
  }, [doflins, doflinSearch]);

  const handleSelectDoflin = (d: DoflinOption) => {
    setSelectedDoflinId(d.id);
    setSelectedDoflinName(d.nombre);
    setDoflinSearch(d.nombre);
    setSearchFocused(false);
    setGenStatus(null);
    setPreview([]);
  };

  const handleGenerate = () => {
    const count = Math.max(1, Math.min(200, quantity));
    setPreview(generateUniqueCodes(count));
    setGenStatus(null);
  };

  const handleSubmitGenerated = async () => {
    if (!selectedDoflinId || preview.length === 0) return;
    setGenLoading(true);
    setGenStatus(null);
    const rows = preview.map((codigo) => ({
      codigo,
      doflinId: selectedDoflinId,
      packSize,
    }));
    try {
      const res = await fetch("/api/admin/codigos/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = (await res.json()) as {
        inserted?: number;
        error?: string;
      };
      if (res.ok) {
        setGenStatus(
          `✅ ${data.inserted ?? 0} códigos guardados para "${selectedDoflinName}".`,
        );
        setPreview([]);
      } else {
        setGenStatus(`❌ ${data.error ?? "Error desconocido"}`);
      }
    } catch {
      setGenStatus("❌ Error de red al guardar los códigos.");
    } finally {
      setGenLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!file) return;
    setCsvLoading(true);
    setCsvStatus(null);

    const text = await file.text();
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    const startIdx = lines[0]?.toLowerCase().includes("codigo") ? 1 : 0;
    const rows = lines
      .slice(startIdx)
      .map((line) => {
        const [codigo, doflinId, ps] = line.split(",").map((c) => c.trim());
        return {
          codigo,
          doflinId: parseInt(doflinId ?? "0", 10),
          packSize: parseInt(ps ?? "1", 10),
        };
      })
      .filter((r) => r.codigo && !isNaN(r.doflinId));

    if (rows.length === 0) {
      setCsvStatus("No se encontraron filas válidas en el CSV.");
      setCsvLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/codigos/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = (await res.json()) as {
        inserted?: number;
        error?: string;
      };
      if (res.ok) {
        setCsvStatus(
          `✅ ${data.inserted ?? 0} códigos insertados correctamente.`,
        );
        setFile(null);
      } else {
        setCsvStatus(`❌ Error: ${data.error ?? "Desconocido"}`);
      }
    } catch {
      setCsvStatus("❌ Error de red al importar.");
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-2xl space-y-6 px-4 py-8 sm:px-8">
      {/* Header */}
      <div>
        <h1 className="font-title text-3xl text-[var(--ink-900)]">
          Códigos de bolsa
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-600)]">
          Genera códigos automáticamente o importa un CSV para carga masiva.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 rounded-2xl border border-[#d8d2b4] bg-[#f5f3ec] p-1.5">
        <button
          type="button"
          onClick={() => setTab("generate")}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === "generate"
              ? "bg-[#4e6f2a] text-white shadow-sm"
              : "text-[var(--ink-700)] hover:bg-white/60"
          }`}
        >
          🎲 Generar códigos
        </button>
        <button
          type="button"
          onClick={() => setTab("csv")}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === "csv"
              ? "bg-[#4e6f2a] text-white shadow-sm"
              : "text-[var(--ink-700)] hover:bg-white/60"
          }`}
        >
          📁 Importar CSV
        </button>
      </div>

      {/* ────────────── TAB: GENERAR ────────────── */}
      {tab === "generate" ? (
        <div className="space-y-5 rounded-2xl border border-[#d8d2b4] bg-white p-6">
          {/* Doflin selector */}
          <div className="relative space-y-1.5">
            <label className="text-sm font-semibold text-[var(--ink-800)]">
              Figura *
            </label>
            <input
              type="text"
              placeholder="Buscar figura por nombre o serie…"
              value={doflinSearch}
              autoComplete="off"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              onChange={(e) => {
                setDoflinSearch(e.target.value);
                if (
                  selectedDoflinName &&
                  e.target.value !== selectedDoflinName
                ) {
                  setSelectedDoflinId(null);
                  setSelectedDoflinName("");
                  setPreview([]);
                }
              }}
              className="h-10 w-full rounded-xl border border-black/15 bg-white px-4 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[#4e6f2a]/30"
            />
            {loadingDoflins && (
              <p className="text-xs text-[var(--ink-500)]">
                Cargando figuras…
              </p>
            )}
            {!loadingDoflins && searchFocused && (
              <div className="absolute z-10 mt-0.5 w-full overflow-hidden rounded-xl border border-[#e2dcc8] bg-white shadow-lg">
                <div className="max-h-48 overflow-y-auto">
                  {filteredDoflins.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-[var(--ink-500)]">
                      Sin resultados.
                    </p>
                  ) : (
                    filteredDoflins.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onMouseDown={() => handleSelectDoflin(d)}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#eef5de] ${
                          selectedDoflinId === d.id
                            ? "bg-[#e2f0c8] font-semibold"
                            : ""
                        }`}
                      >
                        <span className="text-[var(--ink-900)]">
                          {d.nombre}
                        </span>
                        <span className="text-xs text-[var(--ink-500)]">
                          {d.serie} · {d.rareza}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
            {selectedDoflinId && !searchFocused && (
              <p className="text-xs font-medium text-[#4e6f2a]">
                ✓ Figura: {selectedDoflinName}
              </p>
            )}
          </div>

          {/* Quantity + Pack size */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[var(--ink-800)]">
                Cantidad de códigos *
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.max(
                      1,
                      Math.min(200, parseInt(e.target.value || "1", 10)),
                    ),
                  )
                }
                className="h-10 w-full rounded-xl border border-black/15 bg-white px-4 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[#4e6f2a]/30"
              />
              <p className="text-xs text-[var(--ink-500)]">
                Máximo 200 por lote.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[var(--ink-800)]">
                Tamaño de pack *
              </label>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {PACK_SIZES.map((ps) => (
                  <button
                    key={ps}
                    type="button"
                    onClick={() => setPackSize(ps)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      packSize === ps
                        ? "border-[#4e6f2a] bg-[#4e6f2a] text-white"
                        : "border-[#d8d2b4] text-[var(--ink-700)] hover:border-[#4e6f2a]"
                    }`}
                  >
                    {ps}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--ink-500)]">
                Figuras por bolsa física.
              </p>
            </div>
          </div>

          {/* Generate preview button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!selectedDoflinId}
            className="w-full rounded-xl bg-[#4e6f2a] py-2.5 text-sm font-semibold text-white transition hover:bg-[#3d5a20] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ✨ Generar vista previa — {quantity} código
            {quantity === 1 ? "" : "s"}
          </button>

          {/* Preview table */}
          {preview.length > 0 && (
            <div className="space-y-3 rounded-xl border border-[#d8e8b8] bg-[#f8fdf0] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--ink-800)]">
                  Vista previa — {preview.length} códigos
                </p>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="text-xs text-[var(--ink-600)] underline hover:text-[var(--ink-900)]"
                >
                  Regenerar
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-[#ddefc0] bg-white">
                <div className="grid grid-cols-2 sm:grid-cols-3">
                  {preview.slice(0, 60).map((code) => (
                    <code
                      key={code}
                      className="border-b border-[#eef5de] px-3 py-1.5 font-mono text-xs text-[var(--ink-900)]"
                    >
                      {code}
                    </code>
                  ))}
                  {preview.length > 60 && (
                    <p className="col-span-full border-t border-[#eef5de] px-3 py-2 text-xs text-[var(--ink-500)]">
                      +{preview.length - 60} más…
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleSubmitGenerated()}
                disabled={genLoading}
                className="w-full rounded-xl bg-[#2a5010] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e3c0c] disabled:opacity-50"
              >
                {genLoading ? "Guardando…" : `💾 Guardar ${preview.length} códigos`}
              </button>
            </div>
          )}

          {genStatus && (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium ${
                genStatus.startsWith("✅")
                  ? "bg-[#eef5de] text-[#2a4e10]"
                  : "bg-[#fff0f0] text-[#7a2020]"
              }`}
            >
              {genStatus}
            </div>
          )}
        </div>
      ) : (
        /* ────────────── TAB: CSV ────────────── */
        <div className="space-y-5 rounded-2xl border border-[#d8d2b4] bg-white p-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[var(--ink-800)]">
              Archivo CSV
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setCsvStatus(null);
              }}
              className="block w-full cursor-pointer text-sm text-[var(--ink-700)] file:mr-3 file:rounded-lg file:border-0 file:bg-[#eef5de] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#2f5010] hover:file:bg-[#daeab5]"
            />
          </div>

          {file && (
            <p className="rounded-lg bg-[#f5f3ec] px-3 py-2 text-xs text-[var(--ink-600)]">
              📄 {file.name} — {(file.size / 1024).toFixed(1)} KB
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleCsvUpload()}
            disabled={!file || csvLoading}
            className="w-full rounded-xl bg-[#4e6f2a] py-2.5 text-sm font-semibold text-white transition hover:bg-[#3d5a20] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {csvLoading ? "Procesando…" : "Subir códigos"}
          </button>

          {csvStatus && (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium ${
                csvStatus.startsWith("✅")
                  ? "bg-[#eef5de] text-[#2a4e10]"
                  : "bg-[#fff0f0] text-[#7a2020]"
              }`}
            >
              {csvStatus}
            </div>
          )}

          <div className="rounded-xl border border-[#e5e0cc] bg-[#f9f7ef] p-4">
            <h2 className="mb-2 text-sm font-bold text-[var(--ink-800)]">
              Formato esperado
            </h2>
            <pre className="overflow-x-auto rounded-lg bg-white p-3 font-mono text-xs text-[var(--ink-700)]">
              {`codigo,doflin_id,pack_size\nABC1234567,1,5\nDEF8901234,2,15\nGHI5678901,3,30`}
            </pre>
          </div>
        </div>
      )}
    </main>
  );
}

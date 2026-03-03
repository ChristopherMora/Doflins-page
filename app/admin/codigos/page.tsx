"use client";

import { useState } from "react";

export default function AdminCodigosPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus(null);

    const text = await file.text();
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));

    // Skip header row if present
    const startIdx =
      lines[0]?.toLowerCase().includes("codigo") ? 1 : 0;

    const rows = lines.slice(startIdx).map((line) => {
      const [codigo, doflinId, packSize] = line.split(",").map((c) => c.trim());
      return { codigo, doflinId: parseInt(doflinId ?? "0", 10), packSize: parseInt(packSize ?? "1", 10) };
    }).filter((r) => r.codigo && !isNaN(r.doflinId));

    if (rows.length === 0) {
      setStatus("No se encontraron filas válidas en el CSV.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/admin/codigos/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });

    const data = (await res.json()) as { inserted?: number; error?: string };
    if (res.ok) {
      setStatus(`✅ ${data.inserted ?? 0} códigos insertados correctamente.`);
    } else {
      setStatus(`❌ Error: ${data.error ?? "Desconocido"}`);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-surface-50 px-4 py-10 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-ink-900 mb-2">Carga masiva de códigos</h1>
      <p className="text-sm text-ink-600 mb-6">
        Sube un CSV con columnas: <code className="font-mono bg-surface-100 px-1 rounded">codigo, doflin_id, pack_size</code>
      </p>

      <div className="bg-white dark:bg-surface-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-800 mb-2">
            Archivo CSV
          </label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ink-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20 cursor-pointer"
          />
        </div>

        {file && (
          <p className="text-xs text-ink-600 bg-surface-50 rounded-lg px-3 py-2">
            📄 {file.name} — {(file.size / 1024).toFixed(1)} KB
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {loading ? "Procesando…" : "Subir códigos"}
        </button>

        {status && (
          <div className="rounded-xl bg-surface-100 px-4 py-3 text-sm text-ink-800">
            {status}
          </div>
        )}
      </div>

      <div className="mt-6 bg-white dark:bg-surface-200 rounded-2xl shadow-sm p-5">
        <h2 className="text-sm font-bold text-ink-800 mb-2">Formato esperado</h2>
        <pre className="text-xs font-mono bg-surface-50 rounded-lg p-3 overflow-x-auto text-ink-700">
{`codigo,doflin_id,pack_size
ABC123,1,5
DEF456,2,15
GHI789,3,30`}
        </pre>
      </div>
    </main>
  );
}

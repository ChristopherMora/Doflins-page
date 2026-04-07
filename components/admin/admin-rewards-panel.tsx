"use client";

import { useCallback, useEffect, useState } from "react";
import { PencilIcon, TrashIcon, CheckIcon } from "@heroicons/react/24/solid";

// ─── Tipos ─────────────────────────────────────────────────────────────────────

interface Reward {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  pointsCost: number;
  type: string;
  stock: number | null;
  active: boolean;
  createdAt: string;
}

interface Redemption {
  id: number;
  supabaseUserId: string;
  rewardId: number;
  pointsSpent: number;
  status: "pending" | "processed" | "cancelled";
  deliveryData: string | null;
  createdAt: string;
  rewardTitle: string | null;
  displayName: string | null;
}

const EMPTY_FORM = {
  title: "",
  description: "",
  imageUrl: "",
  pointsCost: 100,
  type: "custom" as const,
  stock: "" as string | number,
  active: true,
};

// ─── Componente ────────────────────────────────────────────────────────────────

export function AdminRewardsPanel() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"rewards" | "redemptions" | "points">("rewards");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Estado para el formulario de puntos manuales
  const [pointsForm, setPointsForm] = useState({ userId: "", amount: 0, note: "" });
  const [pointsMsg, setPointsMsg] = useState<string | null>(null);
  const [grantingPoints, setGrantingPoints] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rewards");
      if (!res.ok) return;
      const data = (await res.json()) as { rewards: Reward[]; redemptions: Redemption[] };
      setRewards(data.rewards);
      setRedemptions(data.redemptions);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => { setForm(EMPTY_FORM); setEditId(null); };

  const startEdit = (r: Reward) => {
    setForm({
      title: r.title,
      description: r.description ?? "",
      imageUrl: r.imageUrl ?? "",
      pointsCost: r.pointsCost,
      type: r.type as typeof EMPTY_FORM.type,
      stock: r.stock ?? "",
      active: r.active,
    });
    setEditId(r.id);
    setTab("rewards");
  };

  const saveReward = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        ...form,
        stock: form.stock === "" ? null : Number(form.stock),
        pointsCost: Number(form.pointsCost),
      };

      const res = editId
        ? await fetch("/api/admin/rewards", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, id: editId, type: "reward" }),
          })
        : await fetch("/api/admin/rewards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        setMsg("Error al guardar");
        return;
      }
      setMsg(editId ? "✅ Recompensa actualizada" : "✅ Recompensa creada");
      resetForm();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (id: number) => {
    if (!confirm("¿Desactivar esta recompensa?")) return;
    await fetch(`/api/admin/rewards?id=${id}`, { method: "DELETE" });
    await load();
  };

  const updateRedemptionStatus = async (
    id: number,
    status: Redemption["status"],
    deliveryData?: string,
  ) => {
    await fetch("/api/admin/rewards", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type: "redemption", status, deliveryData }),
    });
    await load();
  };

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-[var(--surface-100)]" />;

  const pendingCount = redemptions.filter((r) => r.status === "pending").length;

  const grantPoints = async () => {
    if (!pointsForm.userId.trim() || pointsForm.amount === 0) return;
    setGrantingPoints(true);
    setPointsMsg(null);
    try {
      const res = await fetch("/api/admin/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseUserId: pointsForm.userId.trim(),
          amount: Number(pointsForm.amount),
          note: pointsForm.note,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setPointsMsg(`❌ ${err.error ?? "Error al otorgar puntos"}`);
        return;
      }
      const data = (await res.json()) as { newBalance: number };
      setPointsMsg(`✅ Listo. Nuevo saldo: ${data.newBalance.toLocaleString("es-MX")} pts`);
      setPointsForm({ userId: "", amount: 0, note: "" });
    } finally {
      setGrantingPoints(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--surface-200)]">
      {([ "rewards", "redemptions", "points"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 pb-2 text-sm font-semibold transition-colors ${
              tab === t
                ? "border-b-2 border-[#4e6f2a] text-[#4e6f2a]"
                : "text-[var(--ink-400)] hover:text-[var(--ink-600)]"
            }`}
          >
            {t === "rewards" ? "Catálogo" : t === "redemptions" ? "Canjes" : "Puntos"}
            {t === "redemptions" && pendingCount > 0 && (
              <span className="rounded-full bg-[#e84a3a] px-1.5 py-0.5 text-xs font-black text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Catálogo de recompensas ────────────────────────────────────── */}
      {tab === "rewards" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formulario */}
          <section className="rounded-2xl border border-[var(--surface-200)] bg-[var(--surface-50)] p-5">
            <h2 className="mb-4 font-bold text-[var(--ink-800)]">
              {editId ? "Editar recompensa" : "Nueva recompensa"}
            </h2>

            {msg && <p className="mb-4 text-sm font-semibold text-[#4e6f2a]">{msg}</p>}

            <div className="space-y-3">
              {[
                { label: "Título *", key: "title", type: "text" },
                { label: "Descripción", key: "description", type: "text" },
                { label: "URL imagen", key: "imageUrl", type: "url" },
                { label: "Costo en puntos *", key: "pointsCost", type: "number" },
                { label: "Stock (vacío = ilimitado)", key: "stock", type: "number" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-semibold text-[var(--ink-600)]">{label}</label>
                  <input
                    type={type}
                    value={(form as Record<string, unknown>)[key] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-[var(--surface-300)] bg-white px-3 py-2 text-sm focus:border-[#4e6f2a] focus:outline-none"
                  />
                </div>
              ))}

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--ink-600)]">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof EMPTY_FORM.type }))}
                  className="w-full rounded-lg border border-[var(--surface-300)] bg-white px-3 py-2 text-sm"
                >
                  <option value="custom">⭐ Especial</option>
                  <option value="discount_code">🏷️ Cupón de descuento</option>
                  <option value="physical">📦 Producto físico</option>
                  <option value="digital">💾 Digital</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="rounded"
                />
                Activa (visible en la tienda)
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                disabled={saving || !form.title || !form.pointsCost}
                onClick={() => void saveReward()}
                className="flex-1 rounded-xl bg-[#4e6f2a] py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? "Guardando…" : editId ? "Actualizar" : "Crear recompensa"}
              </button>
              {editId && (
                <button
                  onClick={resetForm}
                  className="rounded-xl border border-[var(--surface-300)] px-4 py-2 text-sm font-semibold text-[var(--ink-600)]"
                >
                  Cancelar
                </button>
              )}
            </div>
          </section>

          {/* Lista */}
          <section className="space-y-2">
            <h2 className="font-bold text-[var(--ink-800)]">Recompensas ({rewards.length})</h2>
            {rewards.length === 0 && (
              <p className="text-sm text-[var(--ink-400)]">No hay recompensas aún.</p>
            )}
            {rewards.map((r) => (
              <div
                key={r.id}
                className={`flex items-start justify-between gap-3 rounded-xl border p-3 ${
                  r.active
                    ? "border-[var(--surface-200)] bg-white"
                    : "border-[var(--surface-200)] bg-[var(--surface-50)] opacity-60"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--ink-900)]">{r.title}</p>
                  <p className="text-xs text-[var(--ink-500)]">
                    {r.pointsCost} pts · {r.stock !== null ? `${r.stock} en stock` : "∞"} · {r.active ? "✅ Activa" : "⛔ Inactiva"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => startEdit(r)}
                    className="rounded-lg p-1.5 hover:bg-[var(--surface-100)]"
                  >
                    <PencilIcon className="h-4 w-4 text-[var(--ink-500)]" />
                  </button>
                  {r.active && (
                    <button
                      onClick={() => void deactivate(r.id)}
                      className="rounded-lg p-1.5 hover:bg-[#ffeaea]"
                    >
                      <TrashIcon className="h-4 w-4 text-[#e84a3a]" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* ── Canjes pendientes ─────────────────────────────────────────── */}
      {tab === "redemptions" && (
        <div className="space-y-3">
          {redemptions.length === 0 && (
            <p className="text-sm text-[var(--ink-400)]">No hay canjes aún.</p>
          )}
          {redemptions.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-[var(--surface-200)] bg-white p-4"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-[var(--ink-900)]">{r.rewardTitle ?? "—"}</p>
                  <p className="text-xs text-[var(--ink-500)]">
                    {r.displayName ?? r.supabaseUserId.slice(0, 8)} · {r.pointsSpent} pts · {new Date(r.createdAt).toLocaleDateString("es-MX")}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                    r.status === "pending"
                      ? "bg-[#fffbe6] text-[#8a6200]"
                      : r.status === "processed"
                      ? "bg-[#eef5df] text-[#2d4915]"
                      : "bg-[#ffeaea] text-[#8b1a1a]"
                  }`}
                >
                  {r.status === "pending" ? "⏳ Pendiente" : r.status === "processed" ? "✅ Entregado" : "❌ Cancelado"}
                </span>
              </div>

              {r.deliveryData && (
                <p className="mb-2 rounded-lg bg-[var(--surface-50)] px-3 py-2 text-xs text-[var(--ink-600)]">
                  {r.deliveryData}
                </p>
              )}

              {r.status === "pending" && (
                <div className="flex gap-2">
                  <input
                    placeholder="Dato de entrega (cupón, URL, instrucción…)"
                    className="flex-1 rounded-lg border border-[var(--surface-300)] px-3 py-1.5 text-xs focus:border-[#4e6f2a] focus:outline-none"
                    id={`delivery-${r.id}`}
                  />
                  <button
                    onClick={() => {
                      const val = (document.getElementById(`delivery-${r.id}`) as HTMLInputElement)?.value;
                      void updateRedemptionStatus(r.id, "processed", val || undefined);
                    }}
                    className="flex items-center gap-1 rounded-lg bg-[#4e6f2a] px-3 py-1.5 text-xs font-bold text-white"
                  >
                    <CheckIcon className="h-3 w-3" /> Marcar entregado
                  </button>
                  <button
                    onClick={() => void updateRedemptionStatus(r.id, "cancelled")}
                    className="rounded-lg border border-[#fcc] px-3 py-1.5 text-xs font-bold text-[#e84a3a]"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* ── Puntos manuales ───────────────────────────────────────── */}
      {tab === "points" && (
        <section className="rounded-2xl border border-[var(--surface-200)] bg-[var(--surface-50)] p-5 max-w-lg">
          <h2 className="mb-1 font-bold text-[var(--ink-800)]">Otorgar / descontar puntos</h2>
          <p className="mb-4 text-xs text-[var(--ink-400)]">
            Usa el Supabase User ID del usuario (UUID). Para descontar, ingresa un número negativo.
          </p>

          {pointsMsg && (
            <p className="mb-4 rounded-xl bg-[var(--surface-100)] px-4 py-2 text-sm font-semibold text-[var(--ink-700)]">
              {pointsMsg}
            </p>
          )}

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--ink-600)]">
                Supabase User ID *
              </label>
              <input
                type="text"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={pointsForm.userId}
                onChange={(e) => setPointsForm((f) => ({ ...f, userId: e.target.value }))}
                className="w-full rounded-lg border border-[var(--surface-300)] bg-white px-3 py-2 text-sm font-mono focus:border-[#4e6f2a] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--ink-600)]">
                Cantidad de puntos * (negativo para descontar)
              </label>
              <input
                type="number"
                value={pointsForm.amount || ""}
                onChange={(e) => setPointsForm((f) => ({ ...f, amount: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-[var(--surface-300)] bg-white px-3 py-2 text-sm focus:border-[#4e6f2a] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--ink-600)]">
                Nota interna (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Compensación por error en pedido #123"
                value={pointsForm.note}
                onChange={(e) => setPointsForm((f) => ({ ...f, note: e.target.value }))}
                className="w-full rounded-lg border border-[var(--surface-300)] bg-white px-3 py-2 text-sm focus:border-[#4e6f2a] focus:outline-none"
              />
            </div>
          </div>

          <button
            disabled={grantingPoints || !pointsForm.userId.trim() || pointsForm.amount === 0}
            onClick={() => void grantPoints()}
            className={`mt-4 w-full rounded-xl py-2 text-sm font-bold text-white transition-all disabled:opacity-50 ${
              pointsForm.amount < 0 ? "bg-[#b84a4a]" : "bg-[#4e6f2a]"
            }`}
          >
            {grantingPoints
              ? "Procesando…"
              : pointsForm.amount < 0
              ? `Descontar ${Math.abs(pointsForm.amount)} pts`
              : `Otorgar ${pointsForm.amount} pts`}
          </button>
        </section>
      )}
    </div>
  );
}

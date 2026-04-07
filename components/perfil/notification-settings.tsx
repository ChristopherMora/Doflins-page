"use client";

import { useEffect, useState } from "react";
import { EnvelopeIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";

interface Preferences {
  emailNewFigure: boolean;
  emailWeeklyDigest: boolean;
  emailRewardAvailable: boolean;
  emailTradeRequest: boolean;
  pushEnabled: boolean;
}

const DEFAULT_PREFS: Preferences = {
  emailNewFigure: true,
  emailWeeklyDigest: true,
  emailRewardAvailable: true,
  emailTradeRequest: true,
  pushEnabled: false,
};

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        checked ? "bg-[#4e6f2a]" : "bg-[var(--surface-300)]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function NotificationSettings(): React.JSX.Element {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as { preferences: Preferences };
          setPrefs(data.preferences);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const updatePref = async (key: keyof Preferences, value: boolean) => {
    const oldPrefs = prefs;
    setPrefs((p) => ({ ...p, [key]: value }));
    setSaving(true);

    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (!res.ok) {
        setPrefs(oldPrefs);
        toast.error("No se pudieron guardar las preferencias");
      }
    } catch {
      setPrefs(oldPrefs);
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--surface-100)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email notifications */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <EnvelopeIcon className="h-5 w-5 text-[var(--ink-500)]" />
          <h3 className="text-sm font-semibold text-[var(--ink-900)]">
            Notificaciones por email
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-[var(--surface-200)] bg-[var(--background)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--ink-900)]">Nuevas figuras</p>
              <p className="text-xs text-[var(--ink-500)]">Cuando se agreguen nuevas figuras a la colección</p>
            </div>
            <Toggle
              checked={prefs.emailNewFigure}
              onChange={(v) => void updatePref("emailNewFigure", v)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[var(--surface-200)] bg-[var(--background)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--ink-900)]">Resumen semanal</p>
              <p className="text-xs text-[var(--ink-500)]">Progreso de tu colección y novedades</p>
            </div>
            <Toggle
              checked={prefs.emailWeeklyDigest}
              onChange={(v) => void updatePref("emailWeeklyDigest", v)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[var(--surface-200)] bg-[var(--background)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--ink-900)]">Recompensas disponibles</p>
              <p className="text-xs text-[var(--ink-500)]">Cuando puedas canjear una nueva recompensa</p>
            </div>
            <Toggle
              checked={prefs.emailRewardAvailable}
              onChange={(v) => void updatePref("emailRewardAvailable", v)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[var(--surface-200)] bg-[var(--background)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--ink-900)]">Solicitudes de intercambio</p>
              <p className="text-xs text-[var(--ink-500)]">Cuando alguien quiera intercambiar figuras contigo</p>
            </div>
            <Toggle
              checked={prefs.emailTradeRequest}
              onChange={(v) => void updatePref("emailTradeRequest", v)}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {/* Push notifications (future) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <DevicePhoneMobileIcon className="h-5 w-5 text-[var(--ink-500)]" />
          <h3 className="text-sm font-semibold text-[var(--ink-900)]">
            Notificaciones push
          </h3>
        </div>
        <div className="rounded-xl border border-[var(--surface-200)] bg-[var(--background)] px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--ink-900)]">Activar notificaciones push</p>
              <p className="text-xs text-[var(--ink-500)]">Recibe notificaciones en tu dispositivo</p>
            </div>
            <Toggle
              checked={prefs.pushEnabled}
              onChange={(v) => void updatePref("pushEnabled", v)}
              disabled={saving}
            />
          </div>
          {prefs.pushEnabled && (
            <p className="mt-2 text-xs text-[var(--ink-400)] italic">
              Próximamente: Las notificaciones push estarán disponibles muy pronto.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

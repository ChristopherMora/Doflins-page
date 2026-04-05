import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon, BellIcon } from "@heroicons/react/24/solid";

import { BottomNav } from "@/components/nav/bottom-nav";
import { NotificationSettings } from "@/components/perfil/notification-settings";

export const metadata: Metadata = {
  title: "Notificaciones · DOFLINS",
  description: "Configura tus preferencias de notificaciones.",
  robots: { index: false },
};

export default function NotificacionesPage(): React.JSX.Element {
  return (
    <>
      <main className="mx-auto w-full max-w-2xl px-4 py-8 pb-28 sm:px-6">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/perfil"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[var(--ink-700)] transition hover:bg-black/5"
          >
            <ChevronLeftIcon className="h-4 w-4" /> Volver al perfil
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f0fe]">
              <BellIcon className="h-5 w-5 text-[#3b5bdb]" />
            </div>
            <div>
              <h1 className="font-title text-2xl font-black text-[var(--ink-900)]">
                Notificaciones
              </h1>
              <p className="text-sm text-[var(--ink-400)]">
                Elige cómo quieres que te avisemos
              </p>
            </div>
          </div>
        </div>

        {/* Settings */}
        <NotificationSettings />
      </main>

      <BottomNav />
    </>
  );
}

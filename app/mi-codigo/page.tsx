import type { Metadata } from "next";
import { GiftIcon } from "@heroicons/react/24/solid";

import { BottomNav } from "@/components/nav/bottom-nav";
import { SiteHeader } from "@/components/nav/site-header";
import { ReferralCard } from "@/components/ui/referral-card";

export const metadata: Metadata = {
  title: "Mi código de referido | DOFLINS",
  description: "Comparte tu código con amigos y dales 10% de descuento en su primer sobre DOFLINS.",
};

export default function MiCodigoPage(): React.JSX.Element {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl px-5 pb-32 pt-8">
        {/* Header */}
        <div className="mb-6 space-y-1">
          <div className="flex items-center gap-2">
            <GiftIcon className="h-6 w-6 text-[var(--brand-primary)]" />
            <h1 className="font-title text-2xl font-black text-[var(--ink-900)]">
              Código de referido
            </h1>
          </div>
          <p className="text-sm text-[var(--ink-600)]">
            Invita a tus amigos y dales <strong>10% de descuento</strong> en su primer sobre DOFLINS.
          </p>
        </div>

        <ReferralCard />
      </main>
      <BottomNav />
    </>
  );
}

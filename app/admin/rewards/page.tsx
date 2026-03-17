import type { Metadata } from "next";

import { AdminRewardsPanel } from "@/components/admin/admin-rewards-panel";

export const metadata: Metadata = {
  title: "Recompensas Admin · DOFLINS",
  robots: { index: false },
};

export default function AdminRewardsPage(): React.JSX.Element {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 font-title text-2xl font-black text-[var(--ink-900)]">
        Gestión de Recompensas
      </h1>
      <AdminRewardsPanel />
    </main>
  );
}

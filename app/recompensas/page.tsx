import type { Metadata } from "next";

import { RewardsStore } from "@/components/rewards/rewards-store";
import { BottomNav } from "@/components/nav/bottom-nav";

export const metadata: Metadata = {
  title: "Tienda de Puntos · DOFLINS",
  description: "Gana puntos coleccionando figuras y canjéalos por descuentos y recompensas exclusivas.",
  robots: { index: true },
};

export default function RewardsPage(): React.JSX.Element {
  return (
    <>
      <main className="mx-auto w-full max-w-2xl px-4 py-8 pb-28 sm:px-6">
        <RewardsStore />
      </main>
      <BottomNav />
    </>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard | DOFLINS",
  description: "Panel de estadísticas y monitoreo para administradores DOFLINS.",
};

export default function AdminDashboardPage(): React.JSX.Element {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-10 pb-28 sm:px-8 sm:pb-12">
      <nav className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link href="/admin/doflins" className="text-[var(--ink-600)] hover:underline">← Alta de figuras</Link>
        <Link href="/admin/bolsas" className="text-[var(--ink-600)] hover:underline">🎒 Bolsas / QR</Link>
        <Link href="/admin/dashboard" className="font-semibold text-[#4e6f2a] underline">Dashboard</Link>
      </nav>
      <AdminDashboard />
    </main>
  );
}

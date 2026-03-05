import Link from "next/link";
import type { Metadata } from "next";

import { DoflinAdminForm } from "@/components/admin/doflin-admin-form";

export const metadata: Metadata = {
  title: "Admin Doflins | Alta de Figuras",
  description: "Formulario administrativo para subir Doflins, rareza e imágenes.",
};

export default function AdminDoflinsPage(): React.JSX.Element {
  const requireToken = Boolean(process.env.ADMIN_FORM_TOKEN?.trim());
  return (
    <>
      <nav className="flex flex-wrap gap-3 px-6 pt-4 text-sm">
        <Link href="/admin/doflins" className="font-semibold text-[#4e6f2a] underline">Alta de figuras</Link>
        <Link href="/admin/bolsas" className="text-[var(--ink-600)] hover:underline">🎒 Bolsas / QR</Link>
        <Link href="/admin/dashboard" className="text-[var(--ink-600)] hover:underline">Dashboard →</Link>
      </nav>
      <DoflinAdminForm requireToken={requireToken} />
    </>
  );
}

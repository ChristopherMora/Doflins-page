import type { Metadata } from "next";

import { DoflinAdminForm } from "@/components/admin/doflin-admin-form";

export const metadata: Metadata = {
  title: "Admin Doflins | Alta de Figuras",
  description: "Formulario administrativo para subir Doflins, rareza e imágenes.",
};

export default function AdminDoflinsPage(): React.JSX.Element {
  const requireToken = Boolean(process.env.ADMIN_FORM_TOKEN?.trim());
  return <DoflinAdminForm requireToken={requireToken} />;
}

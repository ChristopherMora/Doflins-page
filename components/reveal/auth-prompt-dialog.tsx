"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { AuthPromptDialogProps } from "./types";

export function AuthPromptDialog({
  isOpen,
  isLoading,
  theme,
  onClose,
  onLogin,
}: AuthPromptDialogProps): React.JSX.Element {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Guarda tu progreso con una cuenta</DialogTitle>
          <DialogDescription>
            Para guardar tu progreso necesitas una cuenta. Crea tu acceso con Google y sincroniza tus Doflins encontrados.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          <Button className={theme.primaryButton} disabled={isLoading}
            onClick={() => { onClose(); void onLogin(); }}>
            {isLoading ? "Abriendo..." : "Continuar con Google"}
          </Button>
          <Button variant="secondary" onClick={onClose}>Ahora no</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

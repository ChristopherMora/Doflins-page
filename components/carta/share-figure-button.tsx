"use client";

import { ShareIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface ShareFigureButtonProps {
  nombre: string;
  rareza: string;
}

export function ShareFigureButton({ nombre, rareza }: ShareFigureButtonProps): React.JSX.Element {
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `¡Encontré a ${nombre} (${rareza}) en mi sobre DOFLINS! 🎴✨`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${nombre} | DOFLINS`, text, url });
        return;
      } catch {
        // fallback si el usuario cancela
        return;
      }
    }

    // Fallback: copiar al portapapeles
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("¡Enlace copiado al portapapeles!");
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  };

  return (
    <Button
      variant="secondary"
      className="w-full"
      onClick={() => void handleShare()}
    >
      <ShareIcon className="h-4 w-4" /> Compartir figura
    </Button>
  );
}

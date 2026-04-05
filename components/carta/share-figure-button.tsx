"use client";

import { ShareIcon, ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface ShareFigureButtonProps {
  nombre: string;
  rareza: string;
  imagenUrl: string;
  serie: string;
  numeroColeccion: number;
  doflinId: number;
}

const BASE_URL = typeof window !== "undefined" 
  ? window.location.origin 
  : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://doflins.dofer.mx");

export function ShareFigureButton({ 
  nombre, 
  rareza, 
  imagenUrl,
  serie,
  numeroColeccion,
  doflinId,
}: ShareFigureButtonProps): React.JSX.Element {
  const [downloading, setDownloading] = useState(false);

  const ogUrl = `${BASE_URL}/api/og/doflin?name=${encodeURIComponent(nombre)}&rarity=${rareza}&image=${encodeURIComponent(imagenUrl)}&series=${encodeURIComponent(serie)}&number=${numeroColeccion}`;

  const handleShare = async () => {
    const url = `${BASE_URL}/carta/${doflinId}`;
    const text = `¡Encontré a ${nombre} (${rareza}) en mi sobre DOFLINS! 🎴✨`;

    // Try Web Share API with image
    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
      try {
        // Fetch the OG image as a Blob
        const response = await fetch(ogUrl);
        const blob = await response.blob();
        const file = new File([blob], `${nombre.replace(/\s+/g, "_")}.png`, { type: "image/png" });
        
        const shareData = {
          title: `${nombre} | DOFLINS`,
          text,
          url,
          files: [file],
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      } catch {
        // Fall through to link sharing
      }
    }

    // Fallback: regular share without image
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${nombre} | DOFLINS`, text, url });
        return;
      } catch {
        return;
      }
    }

    // Final fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("¡Enlace copiado al portapapeles!");
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(ogUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `${nombre.replace(/\s+/g, "_")}_DOFLINS.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("¡Imagen descargada!");
    } catch {
      toast.error("Error al descargar la imagen");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex gap-2 w-full">
      <Button
        variant="secondary"
        className="flex-1"
        onClick={() => void handleShare()}
      >
        <ShareIcon className="h-4 w-4" /> Compartir
      </Button>
      <Button
        variant="secondary"
        className="shrink-0"
        onClick={() => void handleDownload()}
        disabled={downloading}
        aria-label="Descargar imagen"
      >
        <ArrowDownTrayIcon className={`h-4 w-4 ${downloading ? "animate-bounce" : ""}`} />
      </Button>
    </div>
  );
}

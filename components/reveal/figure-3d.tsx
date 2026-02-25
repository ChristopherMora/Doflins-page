"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { RARITY_CONFIG } from "@/lib/constants/rarity";
import type { Rarity } from "@/lib/types/doflin";
import { cn } from "@/lib/utils";

interface Figure3DProps {
  src: string;
  fallbackSrc: string;
  alt: string;
  rarity: Rarity;
  className?: string;
  imageClassName?: string;
  disableHover?: boolean;
  modelUrl?: string;
  modelOrientation?: string;
}

let modelViewerLoader: Promise<void> | null = null;

async function ensureModelViewer(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  if (window.customElements.get("model-viewer")) {
    return;
  }

  if (!modelViewerLoader) {
    modelViewerLoader = import("@google/model-viewer").then(() => undefined);
  }

  await modelViewerLoader;
}

function SmartImage({
  src,
  fallbackSrc,
  alt,
  className,
}: {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
}): React.JSX.Element {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasError = failedSrc === src;
  const imageSrc = hasError ? fallbackSrc : src || fallbackSrc;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={700}
      height={700}
      className={className}
      onError={() => setFailedSrc(src)}
      unoptimized
    />
  );
}

function ModelViewer({
  modelUrl,
  alt,
  poster,
  className,
  onError,
  onLoad,
  onTimeout,
  orientation,
}: {
  modelUrl: string;
  alt: string;
  poster: string;
  className?: string;
  onError: () => void;
  onLoad: () => void;
  onTimeout: () => void;
  orientation?: string;
}): React.JSX.Element {
  const nodeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) {
      return undefined;
    }

    const handleLoad = () => onLoad();
    const handleError = () => onError();

    node.addEventListener("load", handleLoad as EventListener);
    node.addEventListener("error", handleError as EventListener);

    const timeoutId = window.setTimeout(() => onTimeout(), 4500);

    return () => {
      window.clearTimeout(timeoutId);
      node.removeEventListener("load", handleLoad as EventListener);
      node.removeEventListener("error", handleError as EventListener);
    };
  }, [onError, onLoad, onTimeout]);

  return (
    <model-viewer
      ref={nodeRef}
      src={modelUrl}
      alt={alt}
      poster={poster}
      loading="lazy"
      orientation={orientation}
      camera-orbit="0deg 60deg auto"
      field-of-view="30deg"
      shadow-intensity="0.65"
      exposure="1.28"
      interaction-prompt="none"
      disable-zoom
      className={className}
      style={{
        background: "transparent",
        display: "block",
      }}
    />
  );
}

export function Figure3D({
  src,
  fallbackSrc,
  alt,
  rarity,
  className,
  imageClassName,
  disableHover = false,
  modelUrl,
  modelOrientation,
}: Figure3DProps): React.JSX.Element {
  const rarityColor = RARITY_CONFIG[rarity].color;
  const [viewerReady, setViewerReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);
  const modelLoadedRef = useRef(false);
  const hasModel = Boolean(modelUrl && viewerReady && !modelFailed);

  useEffect(() => {
    let isMounted = true;

    void ensureModelViewer()
      .then(() => {
        if (isMounted) {
          setViewerReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setViewerReady(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    modelLoadedRef.current = modelLoaded;
  }, [modelLoaded]);

  const baseTilt = { rotateX: 8, rotateY: -10, y: 0, scale: 1 };

  return (
    <motion.div
      style={{ transformPerspective: 1100 }}
      initial={baseTilt}
      animate={baseTilt}
      whileHover={
        disableHover
          ? undefined
          : {
              rotateX: 2,
              rotateY: -1,
              y: -10,
              scale: 1.035,
            }
      }
      transition={{ type: "spring", stiffness: 180, damping: 18, mass: 0.6 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(245,243,255,0.9))] p-4 shadow-[0_28px_42px_rgba(59,31,124,0.2)] [transform-style:preserve-3d]",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -inset-8 rounded-[44px] opacity-45 blur-3xl transition-opacity duration-300 group-hover:opacity-65"
        style={{ background: rarityColor }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.88),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.55),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-x-10 bottom-4 h-7 rounded-full bg-black/18 blur-md [transform:translateZ(-12px)]" />

      {hasModel && modelUrl ? (
        <div className="relative">
          <ModelViewer
            modelUrl={modelUrl}
            alt={alt}
            poster={src || fallbackSrc}
            orientation={modelOrientation}
            className={cn(
              "relative z-20 mx-auto h-[230px] min-h-[130px] w-full [transform:translateZ(38px)]",
              imageClassName,
            )}
            onLoad={() => {
              modelLoadedRef.current = true;
              setModelLoaded(true);
            }}
            onError={() => setModelFailed(true)}
            onTimeout={() => {
              if (!modelLoadedRef.current) {
                setModelFailed(true);
              }
            }}
          />

          {!modelLoaded ? (
            <SmartImage
              src={src}
              fallbackSrc={fallbackSrc}
              alt={alt}
              className={cn(
                "pointer-events-none absolute inset-0 z-10 mx-auto h-full max-h-[260px] w-full object-contain drop-shadow-[0_22px_30px_rgba(26,21,80,0.26)] [transform:translateZ(36px)]",
                imageClassName,
              )}
            />
          ) : null}
        </div>
      ) : (
        <SmartImage
          src={src}
          fallbackSrc={fallbackSrc}
          alt={alt}
          className={cn(
            "relative z-10 mx-auto h-full max-h-[260px] w-full object-contain drop-shadow-[0_22px_30px_rgba(26,21,80,0.26)] [transform:translateZ(36px)]",
            imageClassName,
          )}
        />
      )}
    </motion.div>
  );
}

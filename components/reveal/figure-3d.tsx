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
  modelCameraOrbit?: string;
  modelFieldOfView?: string;
  enableModelControls?: boolean;
  autoRotateModel?: boolean;
  lazyModel?: boolean;
}

let modelViewerLoader: Promise<void> | null = null;

export async function ensureModelViewer(): Promise<void> {
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
  cameraOrbit,
  fieldOfView,
  enableControls,
  autoRotate,
}: {
  modelUrl: string;
  alt: string;
  poster: string;
  className?: string;
  onError: () => void;
  onLoad: () => void;
  onTimeout: () => void;
  orientation?: string;
  cameraOrbit?: string;
  fieldOfView?: string;
  enableControls?: boolean;
  autoRotate?: boolean;
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
      camera-orbit={cameraOrbit ?? "0deg 60deg auto"}
      field-of-view={fieldOfView ?? "30deg"}
      shadow-intensity="0.65"
      exposure="1.28"
      interaction-prompt="none"
      disable-zoom={!enableControls}
      camera-controls={enableControls}
      auto-rotate={autoRotate}
      rotation-per-second="16deg"
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
  modelCameraOrbit,
  modelFieldOfView,
  enableModelControls = false,
  autoRotateModel = false,
  lazyModel = true,
}: Figure3DProps): React.JSX.Element {
  const rarityColor = RARITY_CONFIG[rarity].color;
  const [viewerReady, setViewerReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);
  const [isInView, setIsInView] = useState(!lazyModel);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const modelLoadedRef = useRef(false);
  const hasConfiguredModel = Boolean(modelUrl);
  const hasModel = Boolean(hasConfiguredModel && viewerReady && !modelFailed && isInView);

  useEffect(() => {
    if (!hasConfiguredModel) {
      return undefined;
    }

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
  }, [hasConfiguredModel]);

  useEffect(() => {
    modelLoadedRef.current = modelLoaded;
  }, [modelLoaded]);

  useEffect(() => {
    if (!lazyModel || !hasConfiguredModel) {
      return undefined;
    }

    const node = containerRef.current;
    if (!node || isInView) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "180px 0px",
        threshold: 0.1,
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasConfiguredModel, isInView, lazyModel]);

  const baseTilt = hasConfiguredModel ? { rotateX: 8, rotateY: -10, y: 0, scale: 1 } : { rotateX: 0, rotateY: 0, y: 0, scale: 1 };

  return (
    <motion.div
      ref={containerRef}
      style={{ transformPerspective: 1100 }}
      initial={baseTilt}
      animate={baseTilt}
      whileHover={
        disableHover
          ? undefined
          : hasConfiguredModel
            ? {
                rotateX: 2,
                rotateY: -1,
                y: -10,
                scale: 1.035,
              }
            : {
                y: -5,
                scale: 1.02,
              }
      }
      transition={{ type: "spring", stiffness: 180, damping: 18, mass: 0.6 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl p-4 [transform-style:preserve-3d]",
        hasConfiguredModel
          ? "bg-[linear-gradient(145deg,rgba(255,252,242,0.98),rgba(245,244,226,0.92))] shadow-[0_28px_42px_rgba(65,74,33,0.2)]"
          : "bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(245,247,230,0.94))] shadow-[0_18px_30px_rgba(65,74,33,0.17)]",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -inset-8 rounded-[44px] opacity-45 blur-3xl transition-opacity duration-300 group-hover:opacity-65"
        style={{ background: rarityColor }}
      />

      <div
        className={cn(
          "absolute inset-0",
          hasConfiguredModel
            ? "bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.88),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(241,244,219,0.72),transparent_45%)]"
            : "bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.95),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(227,237,206,0.65),transparent_50%)]",
        )}
      />
      <div className="pointer-events-none absolute inset-x-10 bottom-4 h-7 rounded-full bg-black/18 blur-md [transform:translateZ(-12px)]" />

      {hasModel && modelUrl ? (
        <div className="relative">
          <ModelViewer
            modelUrl={modelUrl}
            alt={alt}
            poster={src || fallbackSrc}
            orientation={modelOrientation}
            cameraOrbit={modelCameraOrbit}
            fieldOfView={modelFieldOfView}
            enableControls={enableModelControls}
            autoRotate={autoRotateModel}
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
                "pointer-events-none absolute inset-0 z-10 mx-auto h-full max-h-[260px] w-full object-contain drop-shadow-[0_22px_30px_rgba(44,50,23,0.26)] [transform:translateZ(36px)]",
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
            "relative z-10 mx-auto h-full max-h-[260px] w-full object-contain drop-shadow-[0_22px_30px_rgba(44,50,23,0.26)] [transform:translateZ(36px)]",
            imageClassName,
          )}
        />
      )}
    </motion.div>
  );
}

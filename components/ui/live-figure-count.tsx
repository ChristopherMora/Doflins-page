"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CollectionPayload {
  status: "ok";
  collection: { id: number }[];
}

interface LiveFigureCountProps {
  className?: string;
  countClassName?: string;
}

/** Animates a number from 0 to `target` over `duration` ms */
function useAnimatedCount(target: number | null, duration = 800): number | null {
  const [display, setDisplay] = useState<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === null) return;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}

export function LiveFigureCount({ className, countClassName }: LiveFigureCountProps): React.JSX.Element {
  const [count, setCount] = useState<number | null>(null);
  const animatedCount = useAnimatedCount(count);
  const baseClassName = cn("inline-flex min-w-[10.5rem] items-center justify-center gap-1.5 rounded-full px-3 py-1", className);

  useEffect(() => {
    fetch("/api/collection", { next: { revalidate: 60 } } as RequestInit)
      .then((r) => (r.ok ? (r.json() as Promise<CollectionPayload>) : null))
      .then((data) => { if (data) setCount(data.collection.length); })
      .catch(() => null);
  }, []);

  if (animatedCount === null) return (
    <span className={cn(baseClassName, "bg-black/5")}>
      <span className="h-3 w-6 animate-pulse rounded bg-black/10" />
      <span className="h-3 w-16 animate-pulse rounded bg-black/[0.08]" />
    </span>
  );

  if (count === 0) return <span />;

  return (
    <span className={cn(baseClassName, "bg-white/60 ring-1 ring-[#cad89e]")}>
      <span className={cn("font-bold text-[var(--brand-primary)]", countClassName)}>{animatedCount}</span> figuras activas
    </span>
  );
}

"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CollectionPayload {
  status: "ok";
  collection: { id: number }[];
}

interface LiveFigureCountProps {
  className?: string;
  countClassName?: string;
}

export function LiveFigureCount({ className, countClassName }: LiveFigureCountProps): React.JSX.Element {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/collection", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<CollectionPayload>) : null))
      .then((data) => { if (data) setCount(data.collection.length); })
      .catch(() => null);
  }, []);

  if (count === null) return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1">
      <span className="h-3 w-6 animate-pulse rounded bg-black/10" />
      <span className="h-3 w-16 animate-pulse rounded bg-black/[0.08]" />
    </span>
  );

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 ring-1 ring-[#cad89e]", className)}>
      <span className={cn("font-bold text-[var(--brand-primary)]", countClassName)}>{count}</span> figuras activas
    </span>
  );
}

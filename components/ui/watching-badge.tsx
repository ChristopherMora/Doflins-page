"use client";

import { useEffect, useRef, useState } from "react";

interface WatchingBadgeProps {
  universe: string;
}

export function WatchingBadge({ universe }: WatchingBadgeProps) {
  const [count, setCount] = useState<number | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!universe) return;

    const es = new EventSource(`/api/watching?universe=${encodeURIComponent(universe)}`);
    esRef.current = es;

    es.onmessage = (e) => {
      const n = parseInt(e.data, 10);
      if (!isNaN(n)) setCount(n);
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [universe]);

  if (count === null || count < 2) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
      </span>
      {count} personas mirando ahora
    </span>
  );
}

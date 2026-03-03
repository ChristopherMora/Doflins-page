"use client";

import { useEffect, useState } from "react";

interface CollectionPayload {
  status: "ok";
  collection: { id: number }[];
}

export function LiveFigureCount(): React.JSX.Element {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/collection", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<CollectionPayload>) : null))
      .then((data) => { if (data) setCount(data.collection.length); })
      .catch(() => null);
  }, []);

  if (count === null) return <></>;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 ring-1 ring-[#cad89e]">
      <span className="font-bold text-[var(--brand-primary)]">{count}</span> figuras activas
    </span>
  );
}

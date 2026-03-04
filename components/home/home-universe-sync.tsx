"use client";

import { useEffect } from "react";

import { broadcastUniverse } from "@/lib/universe-store";

export function HomeUniverseSync(): null {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedUniverse = params.get("universe");

    if (requestedUniverse === "animals" || requestedUniverse === "multiverse") {
      broadcastUniverse(requestedUniverse);
      return;
    }

    broadcastUniverse("neutral");
  }, []);

  return null;
}

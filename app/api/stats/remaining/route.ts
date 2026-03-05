import { NextResponse } from "next/server";

import {
  FALLBACK_REMAINING_BY_RARITY,
  FALLBACK_REMAINING_TOTAL,
} from "@/lib/constants/fallback-catalog";
import { getRemainingByRarity } from "@/lib/server/reveal-service";

export const revalidate = 60;

export async function GET(): Promise<NextResponse> {
  try {
    const stats = await getRemainingByRarity();

    return NextResponse.json({
      status: "ok",
      remaining: stats.remaining,
      totalRemaining: stats.totalRemaining,
    });
  } catch {
    return NextResponse.json({
      status: "ok",
      remaining: FALLBACK_REMAINING_BY_RARITY,
      totalRemaining: FALLBACK_REMAINING_TOTAL,
      source: "fallback",
      message: "Estadísticas cargadas en modo respaldo temporal.",
    });
  }
}

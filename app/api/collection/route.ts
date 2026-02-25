import { NextResponse } from "next/server";

import { FALLBACK_COLLECTION } from "@/lib/constants/fallback-catalog";
import { getCollection } from "@/lib/server/reveal-service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const collection = await getCollection();

    return NextResponse.json(
      {
        status: "ok",
        collection,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=60",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        status: "ok",
        collection: FALLBACK_COLLECTION,
        source: "fallback",
        message: "Colección cargada en modo respaldo temporal.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=30",
        },
      },
    );
  }
}

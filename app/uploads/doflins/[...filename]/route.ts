import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { NextRequest, NextResponse } from "next/server";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "svg", "gif"]);
const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  svg: "image/svg+xml",
  gif: "image/gif",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string[] }> },
): Promise<NextResponse> {
  const { filename } = await params;

  // Evitar path traversal
  const safeName = filename.map((s) => path.basename(s)).join("/");
  const ext = safeName.split(".").pop()?.toLowerCase() ?? "";

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", "doflins", safeName);

  if (!existsSync(filePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const fileStat = await stat(filePath);
  const mimeType = MIME_TYPES[ext] ?? "application/octet-stream";

  const stream = createReadStream(filePath);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(fileStat.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

import { createHash } from "node:crypto";

import type { NextRequest } from "next/server";

// Regex simple para validar IPv4 e IPv6 y evitar que un atacante
// inyecte un header X-Forwarded-For falso con un valor largo/raro
const IP_RE = /^[\w:.]{2,45}$/;

function sanitizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const candidate = raw.split(",")[0].trim();
  return IP_RE.test(candidate) ? candidate : null;
}

export function getClientIp(request: NextRequest): string {
  return (
    sanitizeIp(request.headers.get("x-forwarded-for")) ??
    sanitizeIp(request.headers.get("x-real-ip")) ??
    "0.0.0.0"
  );
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

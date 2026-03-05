interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  success: boolean;
  retryAfter: number;
  remaining: number;
}

const buckets = new Map<string, Bucket>();

// Limpiar buckets expirados cada 5 minutos para evitar memory leak
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 5 * 60_000;

function sweepExpiredBuckets(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
  now = Date.now(),
): RateLimitResult {
  sweepExpiredBuckets(now);

  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      success: true,
      retryAfter: 0,
      remaining: limit - 1,
    };
  }

  if (bucket.count >= limit) {
    return {
      success: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  bucket.count += 1;

  return {
    success: true,
    retryAfter: 0,
    remaining: Math.max(0, limit - bucket.count),
  };
}

export function resetRateLimitBuckets(): void {
  buckets.clear();
}

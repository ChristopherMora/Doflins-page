import { beforeEach, describe, expect, it } from "vitest";

import { checkRateLimit, resetRateLimitBuckets } from "@/lib/server/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitBuckets();
  });

  it("permite hasta el límite definido", () => {
    for (let i = 0; i < 10; i += 1) {
      const result = checkRateLimit("ip-1", 10, 60_000, 1000);
      expect(result.success).toBe(true);
    }
  });

  it("bloquea cuando se supera el límite", () => {
    for (let i = 0; i < 10; i += 1) {
      checkRateLimit("ip-2", 10, 60_000, 1000);
    }

    const blocked = checkRateLimit("ip-2", 10, 60_000, 1000);
    expect(blocked.success).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("resetea la ventana después del tiempo configurado", () => {
    for (let i = 0; i < 10; i += 1) {
      checkRateLimit("ip-3", 10, 60_000, 1000);
    }

    const afterWindow = checkRateLimit("ip-3", 10, 60_000, 1000 + 60_001);
    expect(afterWindow.success).toBe(true);
  });
});

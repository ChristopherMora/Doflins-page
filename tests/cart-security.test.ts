import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";

import { checkBodySize, getCartIdFromRequest, SHOPIFY_CART_COOKIE } from "@/lib/server/shopify-api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockRequest(options: {
  cartCookieValue?: string;
  contentLength?: string | null;
}): NextRequest {
  return {
    cookies: {
      get: (name: string) =>
        name === SHOPIFY_CART_COOKIE && options.cartCookieValue
          ? { value: options.cartCookieValue }
          : undefined,
    },
    headers: {
      get: (name: string) =>
        name === "content-length" ? (options.contentLength ?? null) : null,
    },
  } as unknown as NextRequest;
}

// ─── getCartIdFromRequest ────────────────────────────────────────────────────

describe("getCartIdFromRequest", () => {
  it("retorna el cart ID cuando el formato es válido (GID base64)", () => {
    const validId =
      "gid://shopify/Cart/abc123XYZ_def456?key=abc123&token=xyz789";
    const req = mockRequest({ cartCookieValue: validId });
    expect(getCartIdFromRequest(req)).toBe(validId);
  });

  it("retorna el cart ID con formato URL-safe base64", () => {
    const id = "Z2lkOi8vc2hvcGlmeS9DYXJ0LzEyMzQ1Njc4OTAxMjM0NTY3ODk=";
    const req = mockRequest({ cartCookieValue: id });
    expect(getCartIdFromRequest(req)).toBe(id);
  });

  it("retorna null cuando la cookie está ausente", () => {
    const req = mockRequest({});
    expect(getCartIdFromRequest(req)).toBeNull();
  });

  it("retorna null cuando el cart ID contiene caracteres peligrosos (inyección)", () => {
    const malicious = "../../admin; DROP TABLE carts; --";
    const req = mockRequest({ cartCookieValue: malicious });
    expect(getCartIdFromRequest(req)).toBeNull();
  });

  it("retorna null cuando el cart ID es demasiado corto (< 10 chars)", () => {
    const req = mockRequest({ cartCookieValue: "abc123" });
    expect(getCartIdFromRequest(req)).toBeNull();
  });

  it("retorna null cuando el cart ID supera 250 caracteres", () => {
    const longId = "a".repeat(251);
    const req = mockRequest({ cartCookieValue: longId });
    expect(getCartIdFromRequest(req)).toBeNull();
  });

  it("retorna null cuando el cart ID tiene espacios", () => {
    const req = mockRequest({ cartCookieValue: "abc 123 xyz cart id valid" });
    expect(getCartIdFromRequest(req)).toBeNull();
  });

  it("retorna null con un intento de header injection (\\n)", () => {
    const req = mockRequest({ cartCookieValue: "abc123xyz\nX-Injected: true" });
    expect(getCartIdFromRequest(req)).toBeNull();
  });
});

// ─── checkBodySize ───────────────────────────────────────────────────────────

describe("checkBodySize", () => {
  it("retorna null cuando no hay header content-length", () => {
    const req = mockRequest({ contentLength: null });
    expect(checkBodySize(req)).toBeNull();
  });

  it("retorna null cuando el body está dentro del límite (1KB)", () => {
    const req = mockRequest({ contentLength: "1024" });
    expect(checkBodySize(req)).toBeNull();
  });

  it("retorna null exactamente en el límite (16384 bytes)", () => {
    const req = mockRequest({ contentLength: "16384" });
    expect(checkBodySize(req)).toBeNull();
  });

  it("retorna 413 cuando el body supera el límite por defecto (16KB)", () => {
    const req = mockRequest({ contentLength: "16385" });
    const response = checkBodySize(req);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(413);
  });

  it("retorna 413 cuando el body es extremadamente grande (10MB)", () => {
    const req = mockRequest({ contentLength: String(10 * 1024 * 1024) });
    const response = checkBodySize(req);
    expect(response?.status).toBe(413);
  });

  it("retorna null con límite personalizado cuando el body está dentro", () => {
    const req = mockRequest({ contentLength: "500" });
    expect(checkBodySize(req, 1024)).toBeNull();
  });

  it("retorna 413 con límite personalizado cuando supera", () => {
    const req = mockRequest({ contentLength: "1025" });
    const response = checkBodySize(req, 1024);
    expect(response?.status).toBe(413);
  });

  it("retorna null cuando content-length no es un número válido", () => {
    const req = mockRequest({ contentLength: "not-a-number" });
    expect(checkBodySize(req)).toBeNull();
  });
});

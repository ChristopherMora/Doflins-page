import { describe, expect, it } from "vitest";

import { revealCodeSchema } from "@/lib/validation/reveal";

describe("revealCodeSchema", () => {
  it("normaliza a mayúsculas cuando el código es válido", () => {
    const result = revealCodeSchema.parse("abc123");
    expect(result).toBe("ABC123");
  });

  it("rechaza códigos con caracteres no válidos", () => {
    const result = revealCodeSchema.safeParse("ABC-123");
    expect(result.success).toBe(false);
  });

  it("rechaza códigos fuera del largo permitido", () => {
    const short = revealCodeSchema.safeParse("ABC1");
    const long = revealCodeSchema.safeParse("ABCDEFGHIJKLM");

    expect(short.success).toBe(false);
    expect(long.success).toBe(false);
  });
});

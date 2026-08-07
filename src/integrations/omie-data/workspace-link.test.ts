import { describe, expect, it } from "vitest";
import { abrirBanco } from "omie-data";

describe("workspace omie-data", () => {
  it("expõe abrirBanco importável do pacote omie-data via workspace pnpm", () => {
    expect(typeof abrirBanco).toBe("function");
  });
});

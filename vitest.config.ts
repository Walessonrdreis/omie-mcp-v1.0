import { defineConfig } from "vitest/config";

// A suíte cobre `src/**` (incluindo o cache vendido em `src/data/`) e os
// scripts utilitários de `scripts/**`.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
  },
});

import { defineConfig } from "vitest/config";

// A suíte da raiz cobre só `src/**`. Sem este `include`, o glob padrão do vitest
// varreria também `packages/omie-data`, duplicando a execução dos testes do
// pacote e transformando uma quebra lá dentro numa falha confusa aqui.
// Os testes do omie-data continuam sendo rodados por `npm test` de dentro do
// próprio pacote (é o único lugar onde `npm` é intencional neste repo).
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});

import { describe, expect, it } from "vitest";
import { EstruturaFakeGateway } from "../../infrastructure/gateways/estrutura-fake-gateway.js";
import { BuscarEstruturaPorProdutoUseCase } from "./buscar-estrutura-por-produto.js";

describe("BuscarEstruturaPorProdutoUseCase", () => {
  it("acha produto pela descrição, ignorando maiúsculas/minúsculas e acento", async () => {
    const useCase = new BuscarEstruturaPorProdutoUseCase(new EstruturaFakeGateway());

    const resultado = await useCase.execute({ termo: "100KG" });

    expect(resultado.encontrados).toBe(1);
    expect(resultado.produtos[0].descricaoProduto).toBe("Ração 100kg");
    expect(resultado.produtos[0].itens).toHaveLength(2);
  });

  it("acha produto pelo código", async () => {
    const useCase = new BuscarEstruturaPorProdutoUseCase(new EstruturaFakeGateway());

    const resultado = await useCase.execute({ termo: "prod-002" });

    expect(resultado.encontrados).toBe(1);
    expect(resultado.produtos[0].codigoSku).toBe("PROD-002");
  });

  it("devolve vazio quando não acha nada", async () => {
    const useCase = new BuscarEstruturaPorProdutoUseCase(new EstruturaFakeGateway());

    const resultado = await useCase.execute({ termo: "não existe" });

    expect(resultado.encontrados).toBe(0);
    expect(resultado.produtos).toEqual([]);
  });
});

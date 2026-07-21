import { describe, expect, it } from "vitest";
import { EstoqueFakeGateway } from "../../infrastructure/gateways/estoque-fake-gateway.js";
import { IncluirAjusteEstoqueUseCase } from "./incluir-ajuste-estoque.js";
import { ExcluirAjusteEstoqueUseCase } from "./excluir-ajuste-estoque.js";

describe("CRUD de ajuste de estoque (via fake gateway, sem tocar na Omie real)", () => {
  it("inclui um ajuste de entrada e soma no físico do produto", async () => {
    const gateway = new EstoqueFakeGateway();
    const useCase = new IncluirAjusteEstoqueUseCase(gateway);

    const status = await useCase.execute({
      id_prod: 111,
      data: "20/07/2026",
      tipo: "ENT",
      quan: 10,
      origem: "AJU",
      motivo: "INV",
    });

    expect(status.codigo_status).toBe("0");
    const posicoes = await gateway.listarPosicoesPorProduto(111);
    const total = posicoes.reduce((soma, p) => soma + p.fisico, 0);
    expect(total).toBe(160); // 100 + 50 (fake) + 10 (ajuste)
  });

  it("inclui um ajuste de saída e subtrai do físico do produto", async () => {
    const gateway = new EstoqueFakeGateway();
    const useCase = new IncluirAjusteEstoqueUseCase(gateway);

    await useCase.execute({
      id_prod: 222,
      data: "20/07/2026",
      tipo: "SAI",
      quan: 5,
      origem: "AJU",
      motivo: "OPE",
    });

    const posicoes = await gateway.listarPosicoesPorProduto(222);
    expect(posicoes[0].fisico).toBe(15); // 20 - 5
  });

  it("falha ao incluir ajuste em produto sem posição de estoque", async () => {
    const gateway = new EstoqueFakeGateway();
    const useCase = new IncluirAjusteEstoqueUseCase(gateway);

    await expect(
      useCase.execute({ id_prod: 999999, data: "20/07/2026", tipo: "ENT", quan: 1, origem: "AJU", motivo: "INI" })
    ).rejects.toThrow();
  });

  it("exclui um ajuste e reverte o efeito no físico", async () => {
    const gateway = new EstoqueFakeGateway();
    const incluirUseCase = new IncluirAjusteEstoqueUseCase(gateway);
    const excluirUseCase = new ExcluirAjusteEstoqueUseCase(gateway);

    const status = await incluirUseCase.execute({
      id_prod: 111,
      data: "20/07/2026",
      tipo: "ENT",
      quan: 20,
      origem: "AJU",
      motivo: "INV",
    });

    await excluirUseCase.execute({ id_ajuste: status.id_ajuste });

    const posicoes = await gateway.listarPosicoesPorProduto(111);
    const total = posicoes.reduce((soma, p) => soma + p.fisico, 0);
    expect(total).toBe(150); // volta ao original (100 + 50)
  });

  it("falha ao excluir ajuste inexistente", async () => {
    const gateway = new EstoqueFakeGateway();
    const useCase = new ExcluirAjusteEstoqueUseCase(gateway);

    await expect(useCase.execute({ id_ajuste: 999999 })).rejects.toThrow();
  });

  it("uma instância do fake gateway não vaza estado pra outra", async () => {
    const gatewayA = new EstoqueFakeGateway();
    await new IncluirAjusteEstoqueUseCase(gatewayA).execute({
      id_prod: 111,
      data: "20/07/2026",
      tipo: "ENT",
      quan: 999,
      origem: "AJU",
      motivo: "INV",
    });

    const gatewayB = new EstoqueFakeGateway();
    const posicoes = await gatewayB.listarPosicoesPorProduto(111);
    const total = posicoes.reduce((soma, p) => soma + p.fisico, 0);
    expect(total).toBe(150);
  });
});

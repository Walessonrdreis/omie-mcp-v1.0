import { describe, expect, it } from "vitest";
import { EstoqueFakeGateway } from "../../infrastructure/gateways/estoque-fake-gateway.js";
import { ConsultarEstoqueTotalProdutoUseCase } from "./consultar-estoque-total-produto.js";

describe("ConsultarEstoqueTotalProdutoUseCase", () => {
  it("soma físico/saldo/reservado do produto em todos os locais", async () => {
    const useCase = new ConsultarEstoqueTotalProdutoUseCase(new EstoqueFakeGateway());

    const resultado = await useCase.execute(111);

    expect(resultado.quantidadeFisicaTotal).toBe(150);
    expect(resultado.saldoTotal).toBe(140);
    expect(resultado.reservadoTotal).toBe(10);
    expect(resultado.locais).toHaveLength(2);
  });

  it("lança erro quando o produto não tem posição de estoque", async () => {
    const useCase = new ConsultarEstoqueTotalProdutoUseCase(new EstoqueFakeGateway());

    await expect(useCase.execute(999)).rejects.toThrow(
      "Nenhuma posição de estoque encontrada para o produto de código 999."
    );
  });
});

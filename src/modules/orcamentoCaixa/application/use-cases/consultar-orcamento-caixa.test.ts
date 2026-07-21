import { describe, expect, it } from "vitest";
import { OrcamentoCaixaFakeGateway } from "../../infrastructure/gateways/orcamento-caixa-fake-gateway.js";
import { ConsultarOrcamentoCaixaUseCase } from "./consultar-orcamento-caixa.js";

describe("ConsultarOrcamentoCaixaUseCase", () => {
  it("consulta o orçamento com previsto, realizado e diferença calculada", async () => {
    const useCase = new ConsultarOrcamentoCaixaUseCase(new OrcamentoCaixaFakeGateway());

    const resultado = await useCase.execute({ ano: 2026, mes: 7 });

    expect(resultado.ano).toBe(2026);
    expect(resultado.categorias).toHaveLength(4);
    const receitas = resultado.categorias.find((c) => c.codigoCategoria === "1");
    expect(receitas?.diferenca).toBe(-500);
  });

  it("aplica o filtro genérico sobre as categorias", async () => {
    const useCase = new ConsultarOrcamentoCaixaUseCase(new OrcamentoCaixaFakeGateway());

    const resultado = await useCase.execute({
      ano: 2026,
      mes: 7,
      filtros: [{ campo: "codigoCategoria", operador: "igual", valor: "2" }],
    });

    expect(resultado.categorias).toHaveLength(1);
  });
});

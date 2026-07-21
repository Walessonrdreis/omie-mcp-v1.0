import { describe, expect, it } from "vitest";
import { ContasCorrentesFakeGateway } from "../../infrastructure/gateways/contas-correntes-fake-gateway.js";
import { ConsultarExtratoUseCase } from "./consultar-extrato.js";

describe("ConsultarExtratoUseCase", () => {
  it("consulta o extrato com saldos e movimentos mapeados", async () => {
    const useCase = new ConsultarExtratoUseCase(new ContasCorrentesFakeGateway());

    const resultado = await useCase.execute({
      codigo_conta_corrente: 9183200875,
      periodo_inicial: "01/07/2026",
      periodo_final: "20/07/2026",
    });

    expect(resultado.descricaoConta).toBe("Cartão NuBank (fake)");
    expect(resultado.saldoAnterior).toBe(1000);
    expect(resultado.movimentos).toHaveLength(2);
    expect(resultado.movimentos[1].natureza).toBe("receita");
  });

  it("aplica o filtro genérico sobre os movimentos", async () => {
    const useCase = new ConsultarExtratoUseCase(new ContasCorrentesFakeGateway());

    const resultado = await useCase.execute({
      codigo_conta_corrente: 9183200875,
      periodo_inicial: "01/07/2026",
      periodo_final: "20/07/2026",
      filtros: [{ campo: "natureza", operador: "igual", valor: "receita" }],
    });

    expect(resultado.movimentos).toHaveLength(1);
  });

  it("lança erro para conta inexistente", async () => {
    const useCase = new ConsultarExtratoUseCase(new ContasCorrentesFakeGateway());

    await expect(
      useCase.execute({ codigo_conta_corrente: 999999, periodo_inicial: "01/07/2026", periodo_final: "20/07/2026" })
    ).rejects.toThrow();
  });
});

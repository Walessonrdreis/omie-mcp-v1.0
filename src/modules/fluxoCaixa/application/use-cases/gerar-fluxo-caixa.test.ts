import { describe, expect, it } from "vitest";
import { ContasCorrentesFakeGateway } from "../../../contasCorrentes/infrastructure/gateways/contas-correntes-fake-gateway.js";
import { FinancasFakeGateway } from "../../infrastructure/gateways/financas-fake-gateway.js";
import { GerarFluxoCaixaUseCase } from "./gerar-fluxo-caixa.js";

describe("GerarFluxoCaixaUseCase", () => {
  function montarUseCase() {
    return new GerarFluxoCaixaUseCase(new FinancasFakeGateway(), new ContasCorrentesFakeGateway());
  }

  it("separa realizado de previsto e exclui lançamentos cancelados", async () => {
    const useCase = montarUseCase();

    const resultado = await useCase.execute({
      data_inicio: "01/12/2026",
      data_fim: "31/12/2026",
      apenas_favoritas: false,
    });

    expect(resultado.totalMovimentosRealizados).toBe(3);
    expect(resultado.totalMovimentosPrevistos).toBe(1);

    const linhasConta1 = resultado.linhas.filter((l) => l.codigoContaCorrente === 9183200875);
    const saldoRealizadoTotal = linhasConta1.reduce((acc, l) => acc + l.saldoRealizadoPeriodo, 0);
    expect(Math.round(saldoRealizadoTotal * 100) / 100).toBe(350);
  });

  it("não inclui previsto quando incluir_previsto=false", async () => {
    const useCase = montarUseCase();

    const resultado = await useCase.execute({
      data_inicio: "01/12/2026",
      data_fim: "31/12/2026",
      apenas_favoritas: false,
      incluir_previsto: false,
    });

    expect(resultado.totalMovimentosPrevistos).toBe(0);
  });

  it("calcula saldoRealAcumulado a partir do saldo_inicial/saldo_data quando usar_saldo_real=true", async () => {
    const useCase = montarUseCase();

    const resultado = await useCase.execute({
      data_inicio: "10/12/2026",
      data_fim: "31/12/2026",
      apenas_favoritas: false,
      usar_saldo_real: true,
    });

    const linhaConta1 = resultado.linhas.find((l) => l.codigoContaCorrente === 9183200875);
    // saldo_inicial 1000 (saldo_data 01/12) + movimentos entre a saldo_data e o início do
    // período (03/12: +150, 05/12: +300 => offset 1450) + saldoRealizadoAcumulado do período
    // pedido (-100, só o pagamento de 10/12 cai dentro de 10/12-31/12) = 1350.
    expect(linhaConta1?.saldoRealAcumulado).toBe(1350);
  });
});

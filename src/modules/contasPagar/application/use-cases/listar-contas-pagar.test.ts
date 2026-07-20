import { describe, expect, it } from "vitest";
import { ClientesFakeGateway } from "../../../clientesFornecedores/infrastructure/gateways/clientes-fake-gateway.js";
import { ContasPagarFakeGateway } from "../../infrastructure/gateways/contas-pagar-fake-gateway.js";
import { ListarContasPagarUseCase } from "./listar-contas-pagar.js";

describe("ListarContasPagarUseCase", () => {
  it("resolve o nome do fornecedor pra cada conta a pagar", async () => {
    const useCase = new ListarContasPagarUseCase(
      new ContasPagarFakeGateway(),
      new ClientesFakeGateway()
    );

    const resultado = await useCase.execute({});

    expect(resultado.totalRegistros).toBe(2);
    const conta1 = resultado.contas.find((c) => c.codigoLancamento === 7001);
    expect(conta1?.fornecedor.razaoSocial).toBe("Fornecedor Fake S.A.");
    expect(conta1?.status).toBe("ABERTO");
  });

  it("mostra fornecedor não encontrado quando o código não existe no cadastro", async () => {
    const contasGateway = new ContasPagarFakeGateway([
      {
        codigo_lancamento_omie: 7099,
        codigo_cliente_fornecedor: 9999,
        data_vencimento: "01/12/2026",
        valor_documento: 10,
        status_titulo: "ABERTO",
        numero_documento_fiscal: "",
        codigo_categoria: "",
        observacao: "",
      },
    ]);
    const useCase = new ListarContasPagarUseCase(contasGateway, new ClientesFakeGateway());

    const resultado = await useCase.execute({});

    expect(resultado.contas[0].fornecedor.razaoSocial).toBe("(fornecedor não encontrado)");
  });
});

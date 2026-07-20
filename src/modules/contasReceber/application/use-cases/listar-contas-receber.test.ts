import { describe, expect, it } from "vitest";
import { ClientesFakeGateway } from "../../../clientesFornecedores/infrastructure/gateways/clientes-fake-gateway.js";
import { ContasReceberFakeGateway } from "../../infrastructure/gateways/contas-receber-fake-gateway.js";
import { ListarContasReceberUseCase } from "./listar-contas-receber.js";

describe("ListarContasReceberUseCase", () => {
  it("resolve o nome do cliente pra cada conta a receber", async () => {
    const useCase = new ListarContasReceberUseCase(
      new ContasReceberFakeGateway(),
      new ClientesFakeGateway()
    );

    const resultado = await useCase.execute({});

    expect(resultado.totalRegistros).toBe(2);
    const conta1 = resultado.contas.find((c) => c.codigoLancamento === 8001);
    expect(conta1?.cliente.razaoSocial).toBe("Cliente Fake Ltda");
    expect(conta1?.status).toBe("ABERTO");
    expect(conta1?.numeroPedido).toBe("1");
  });

  it("mostra cliente não encontrado quando o código não existe no cadastro", async () => {
    const contasGateway = new ContasReceberFakeGateway([
      {
        codigo_lancamento_omie: 8099,
        codigo_cliente_fornecedor: 9999,
        data_vencimento: "01/12/2026",
        valor_documento: 10,
        status_titulo: "ABERTO",
        numero_documento_fiscal: "",
        numero_pedido: "",
        codigo_categoria: "",
      },
    ]);
    const useCase = new ListarContasReceberUseCase(contasGateway, new ClientesFakeGateway());

    const resultado = await useCase.execute({});

    expect(resultado.contas[0].cliente.razaoSocial).toBe("(cliente não encontrado)");
  });
});

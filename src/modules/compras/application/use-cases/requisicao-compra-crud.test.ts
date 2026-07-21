import { describe, expect, it } from "vitest";
import { RequisicaoCompraFakeGateway } from "../../infrastructure/gateways/requisicao-compra-fake-gateway.js";
import {
  AlterarRequisicaoCompraUseCase,
  ConsultarRequisicaoCompraUseCase,
  ExcluirRequisicaoCompraUseCase,
  IncluirRequisicaoCompraUseCase,
  ListarRequisicoesCompraUseCase,
} from "./requisicao-compra-crud.js";

describe("Requisição de Compra CRUD", () => {
  it("inclui, consulta, altera, lista e exclui uma requisição", async () => {
    const gateway = new RequisicaoCompraFakeGateway();

    const incluir = await new IncluirRequisicaoCompraUseCase(gateway).execute({
      cod_int_requisicao: "TESTE-REQ-001",
      codigo_categoria: "2.09.01",
      data_sugestao: "25/07/2026",
      itens: [{ cod_int_item: "1", codigo_produto: 500, quantidade: 3, preco_unitario: 10 }],
    });
    expect(incluir.codigoStatus).toBe("0");
    const codigoRequisicao = incluir.codigoRequisicao;

    const consulta = await new ConsultarRequisicaoCompraUseCase(gateway).execute({
      codigo_requisicao: codigoRequisicao,
    });
    expect(consulta.itens).toHaveLength(1);
    expect(consulta.itens[0].quantidade).toBe(3);

    const listagem = await new ListarRequisicoesCompraUseCase(gateway).execute({});
    expect(listagem.totalRegistros).toBe(1);

    const alterar = await new AlterarRequisicaoCompraUseCase(gateway).execute({
      codigo_requisicao: codigoRequisicao,
      itens: [{ cod_int_item: "1", codigo_produto: 500, quantidade: 6, preco_unitario: 10 }],
    });
    expect(alterar.codigoStatus).toBe("0");

    const consultaAlterada = await new ConsultarRequisicaoCompraUseCase(gateway).execute({
      codigo_requisicao: codigoRequisicao,
    });
    expect(consultaAlterada.itens[0].quantidade).toBe(6);

    const excluir = await new ExcluirRequisicaoCompraUseCase(gateway).execute({
      codigo_requisicao: codigoRequisicao,
    });
    expect(excluir.codigoStatus).toBe("0");

    await expect(
      new ConsultarRequisicaoCompraUseCase(gateway).execute({ codigo_requisicao: codigoRequisicao })
    ).rejects.toThrow();
  });

  it("aplica o filtro genérico na listagem", async () => {
    const gateway = new RequisicaoCompraFakeGateway();
    await new IncluirRequisicaoCompraUseCase(gateway).execute({
      cod_int_requisicao: "TESTE-REQ-002",
      codigo_categoria: "2.09.99",
      data_sugestao: "25/07/2026",
      itens: [{ cod_int_item: "1", codigo_produto: 999, quantidade: 1 }],
    });

    const resultado = await new ListarRequisicoesCompraUseCase(gateway).execute({
      filtros: [{ campo: "codigoCategoria", operador: "igual", valor: "2.09.99" }],
    });
    expect(resultado.requisicoes).toHaveLength(1);
  });
});

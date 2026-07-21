import { describe, expect, it } from "vitest";
import { PedidoCompraFakeGateway } from "../../infrastructure/gateways/pedido-compra-fake-gateway.js";
import {
  AlterarPedidoCompraUseCase,
  ConsultarPedidoCompraUseCase,
  ExcluirPedidoCompraUseCase,
  IncluirPedidoCompraUseCase,
  ListarPedidosCompraUseCase,
} from "./pedido-compra-crud.js";

describe("Pedido de Compra CRUD", () => {
  it("inclui, consulta, altera, lista e exclui um pedido", async () => {
    const gateway = new PedidoCompraFakeGateway();

    const incluir = await new IncluirPedidoCompraUseCase(gateway).execute({
      cod_int_pedido: "TESTE-001",
      data_previsao: "25/07/2026",
      quantidade_parcelas: 1,
      codigo_fornecedor: 100,
      codigo_conta_corrente: 200,
      itens: [{ cod_int_item: "1", codigo_produto: 500, quantidade: 5, valor_unitario: 10 }],
    });
    expect(incluir.codigoStatus).toBe("0");
    const codigoPedido = incluir.codigoPedido;

    const consulta = await new ConsultarPedidoCompraUseCase(gateway).execute({ codigo_pedido: codigoPedido });
    expect(consulta.valorTotal).toBe(50);
    expect(consulta.itens).toHaveLength(1);

    const listagem = await new ListarPedidosCompraUseCase(gateway).execute({});
    expect(listagem.totalRegistros).toBe(1);
    expect(listagem.pedidos[0].codigoPedido).toBe(codigoPedido);

    const alterar = await new AlterarPedidoCompraUseCase(gateway).execute({
      codigo_pedido: codigoPedido,
      itens: [{ cod_int_item: "1", codigo_produto: 500, quantidade: 8, valor_unitario: 10 }],
    });
    expect(alterar.codigoStatus).toBe("0");

    const consultaAlterada = await new ConsultarPedidoCompraUseCase(gateway).execute({
      codigo_pedido: codigoPedido,
    });
    expect(consultaAlterada.valorTotal).toBe(80);

    const excluir = await new ExcluirPedidoCompraUseCase(gateway).execute({ codigo_pedido: codigoPedido });
    expect(excluir.codigoStatus).toBe("0");

    await expect(
      new ConsultarPedidoCompraUseCase(gateway).execute({ codigo_pedido: codigoPedido })
    ).rejects.toThrow();
  });

  it("aplica o filtro genérico na listagem", async () => {
    const gateway = new PedidoCompraFakeGateway();
    await new IncluirPedidoCompraUseCase(gateway).execute({
      cod_int_pedido: "TESTE-002",
      data_previsao: "25/07/2026",
      quantidade_parcelas: 1,
      codigo_fornecedor: 999,
      codigo_conta_corrente: 200,
      itens: [{ cod_int_item: "1", codigo_produto: 500, quantidade: 1, valor_unitario: 1 }],
    });

    const resultado = await new ListarPedidosCompraUseCase(gateway).execute({
      filtros: [{ campo: "codigoFornecedor", operador: "igual", valor: 999 }],
    });
    expect(resultado.pedidos).toHaveLength(1);
  });
});

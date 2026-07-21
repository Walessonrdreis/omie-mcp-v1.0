import { describe, expect, it } from "vitest";
import { PedidoVendaFakeGateway } from "../../infrastructure/gateways/pedido-venda-fake-gateway.js";
import { IncluirPedidoUseCase } from "./incluir-pedido.js";
import { AlterarPedidoUseCase } from "./alterar-pedido.js";
import { ExcluirPedidoUseCase } from "./excluir-pedido.js";
import { ConsultarPedidoUseCase } from "./consultar-pedido.js";

describe("CRUD de pedido de venda (via fake gateway, sem tocar na Omie real)", () => {
  it("inclui um pedido novo", async () => {
    const gateway = new PedidoVendaFakeGateway();
    const useCase = new IncluirPedidoUseCase(gateway);

    const status = await useCase.execute({
      codigo_cliente: 5001,
      data_previsao: "31/12/2026",
      etapa: "10",
      codigo_parcela: "000",
      codigo_categoria: "1.01.01",
      codigo_conta_corrente: 1,
      consumidor_final: "N",
      itens: [{ codigo_item_integracao: "ITEM-1", codigo_produto: 111, quantidade: 2, valor_unitario: 25 }],
    });

    expect(status.codigo_status).toBe("0");
    const consultado = await gateway.consultarPedido({ codigo_pedido: status.codigo_pedido });
    expect(consultado.cabecalho.codigo_cliente).toBe(5001);
    expect(consultado.total_pedido.valor_total_pedido).toBe(50);
  });

  it("consulta um pedido existente", async () => {
    const gateway = new PedidoVendaFakeGateway();
    const useCase = new ConsultarPedidoUseCase(gateway);

    const pedido = await useCase.execute({ codigo_pedido: 9001 });

    expect(pedido.cabecalho.codigo_cliente).toBe(5001);
  });

  it("falha ao consultar pedido inexistente", async () => {
    const gateway = new PedidoVendaFakeGateway();
    const useCase = new ConsultarPedidoUseCase(gateway);

    await expect(useCase.execute({ codigo_pedido: 999999 })).rejects.toThrow();
  });

  it("altera itens de um pedido existente", async () => {
    const gateway = new PedidoVendaFakeGateway();
    const useCase = new AlterarPedidoUseCase(gateway);

    const status = await useCase.execute({
      codigo_pedido: 9001,
      codigo_cliente: 5001,
      data_previsao: "01/01/2027",
      etapa: "10",
      codigo_parcela: "000",
      codigo_categoria: "1.01.01",
      codigo_conta_corrente: 1,
      consumidor_final: "N",
      itens: [{ codigo_item_integracao: "ITEM-1", codigo_produto: 111, quantidade: 10, valor_unitario: 25 }],
    });

    expect(status.codigo_status).toBe("0");
    const consultado = await gateway.consultarPedido({ codigo_pedido: 9001 });
    expect(consultado.total_pedido.valor_total_pedido).toBe(250);
  });

  it("exclui um pedido existente", async () => {
    const gateway = new PedidoVendaFakeGateway();
    const useCase = new ExcluirPedidoUseCase(gateway);

    const status = await useCase.execute({ codigo_pedido: 9002 });

    expect(status.codigo_status).toBe("0");
    await expect(gateway.consultarPedido({ codigo_pedido: 9002 })).rejects.toThrow();
  });

  it("uma instância do fake gateway não vaza estado pra outra", async () => {
    const gatewayA = new PedidoVendaFakeGateway();
    await new IncluirPedidoUseCase(gatewayA).execute({
      codigo_cliente: 5001,
      data_previsao: "31/12/2026",
      etapa: "10",
      codigo_parcela: "000",
      codigo_categoria: "1.01.01",
      codigo_conta_corrente: 1,
      consumidor_final: "N",
      itens: [{ codigo_item_integracao: "ITEM-1", codigo_produto: 111, quantidade: 1, valor_unitario: 1 }],
    });

    const gatewayB = new PedidoVendaFakeGateway();
    const resultado = await gatewayB.listarPedidosPagina(1, 50);
    expect(resultado.total_de_registros).toBe(2);
  });
});

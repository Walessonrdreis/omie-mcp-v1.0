import { describe, expect, it } from "vitest";
import { ClientesFakeGateway } from "../../../clientesFornecedores/infrastructure/gateways/clientes-fake-gateway.js";
import { PedidoVendaFakeGateway } from "../../infrastructure/gateways/pedido-venda-fake-gateway.js";
import { ListarPedidosComClienteUseCase } from "./listar-pedidos-com-cliente.js";

describe("ListarPedidosComClienteUseCase", () => {
  it("resolve cliente e etapa por extenso pra cada pedido", async () => {
    const useCase = new ListarPedidosComClienteUseCase(
      new PedidoVendaFakeGateway(),
      new ClientesFakeGateway()
    );

    const resultado = await useCase.execute({});

    expect(resultado.totalRegistros).toBe(2);
    const pedido1 = resultado.pedidos.find((p) => p.codigoPedido === 9001);
    expect(pedido1?.cliente.razaoSocial).toBe("Cliente Fake Ltda");
    expect(pedido1?.etapaDescricao).toBe("Separar Estoque");
    expect(pedido1?.cancelado).toBe(false);
    expect(pedido1?.itens).toHaveLength(1);
  });

  it("filtra por etapa_codigo quando informado", async () => {
    const useCase = new ListarPedidosComClienteUseCase(
      new PedidoVendaFakeGateway(),
      new ClientesFakeGateway()
    );

    const resultado = await useCase.execute({ etapa_codigo: "20" });

    expect(resultado.pedidos).toHaveLength(2);
  });

  it("aplica o filtro genérico sobre campo aninhado (cliente.razaoSocial)", async () => {
    const useCase = new ListarPedidosComClienteUseCase(
      new PedidoVendaFakeGateway(),
      new ClientesFakeGateway()
    );

    const resultado = await useCase.execute({
      filtros: [{ campo: "cliente.razaoSocial", operador: "contem", valor: "fornecedor" }],
    });

    expect(resultado.pedidos).toHaveLength(1);
    expect(resultado.pedidos[0].codigoPedido).toBe(9002);
  });
});

import { describe, expect, it } from "vitest";
import { ClientesFakeGateway } from "../../../clientesFornecedores/infrastructure/gateways/clientes-fake-gateway.js";
import { PedidoVendaFakeGateway } from "../../infrastructure/gateways/pedido-venda-fake-gateway.js";
import { ListarPedidosComClienteUseCase } from "./listar-pedidos-com-cliente.js";
import { ListarPedidosSepararEstoqueUseCase } from "./listar-pedidos-separar-estoque.js";

describe("ListarPedidosSepararEstoqueUseCase", () => {
  function montarUseCase() {
    const listarComCliente = new ListarPedidosComClienteUseCase(
      new PedidoVendaFakeGateway(),
      new ClientesFakeGateway()
    );
    return new ListarPedidosSepararEstoqueUseCase(listarComCliente);
  }

  it("remove pedidos cancelados por padrão (a Omie não reseta a etapa deles)", async () => {
    const useCase = montarUseCase();

    const resultado = await useCase.execute({});

    expect(resultado.pedidos).toHaveLength(1);
    expect(resultado.pedidos[0].codigoPedido).toBe(9001);
  });

  it("inclui cancelados quando incluir_cancelados=true", async () => {
    const useCase = montarUseCase();

    const resultado = await useCase.execute({ incluir_cancelados: true });

    expect(resultado.pedidos).toHaveLength(2);
  });
});

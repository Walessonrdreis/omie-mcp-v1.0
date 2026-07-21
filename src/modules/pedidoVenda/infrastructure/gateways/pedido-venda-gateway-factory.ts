import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { IPedidoVendaGateway } from "../../domain/interfaces/pedido-venda-gateway.js";
import { PedidoVendaFakeGateway } from "./pedido-venda-fake-gateway.js";
import { PedidoVendaOmieGateway } from "./pedido-venda-omie-gateway.js";

export function criarPedidoVendaGateway(client: OmieClient): IPedidoVendaGateway {
  return process.env.OMIE_MOCK === "true"
    ? new PedidoVendaFakeGateway()
    : new PedidoVendaOmieGateway(client);
}

export { criarClientesGateway } from "../../../clientesFornecedores/infrastructure/gateways/clientes-gateway-factory.js";

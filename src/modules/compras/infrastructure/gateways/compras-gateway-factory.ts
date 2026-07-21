import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { IPedidoCompraGateway } from "../../domain/interfaces/pedido-compra-gateway.js";
import { IRequisicaoCompraGateway } from "../../domain/interfaces/requisicao-compra-gateway.js";
import { PedidoCompraFakeGateway } from "./pedido-compra-fake-gateway.js";
import { PedidoCompraOmieGateway } from "./pedido-compra-omie-gateway.js";
import { RequisicaoCompraFakeGateway } from "./requisicao-compra-fake-gateway.js";
import { RequisicaoCompraOmieGateway } from "./requisicao-compra-omie-gateway.js";

export function criarPedidoCompraGateway(client: OmieClient): IPedidoCompraGateway {
  return process.env.OMIE_MOCK === "true"
    ? new PedidoCompraFakeGateway()
    : new PedidoCompraOmieGateway(client);
}

export function criarRequisicaoCompraGateway(client: OmieClient): IRequisicaoCompraGateway {
  return process.env.OMIE_MOCK === "true"
    ? new RequisicaoCompraFakeGateway()
    : new RequisicaoCompraOmieGateway(client);
}

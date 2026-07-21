export { comprasModuleTools } from "./compras-register.js";
export type {
  IPedidoCompraGateway,
  PedidoCompraOmie,
} from "./domain/interfaces/pedido-compra-gateway.js";
export type {
  IRequisicaoCompraGateway,
  RequisicaoCompraOmie,
} from "./domain/interfaces/requisicao-compra-gateway.js";
export { PedidoCompraOmieGateway } from "./infrastructure/gateways/pedido-compra-omie-gateway.js";
export { PedidoCompraFakeGateway } from "./infrastructure/gateways/pedido-compra-fake-gateway.js";
export { RequisicaoCompraOmieGateway } from "./infrastructure/gateways/requisicao-compra-omie-gateway.js";
export { RequisicaoCompraFakeGateway } from "./infrastructure/gateways/requisicao-compra-fake-gateway.js";

export { estoqueModuleTools } from "./estoque-register.js";
export type { IEstoqueGateway, PosicaoEstoque } from "./domain/interfaces/estoque-gateway.js";
export { EstoqueOmieGateway } from "./infrastructure/gateways/estoque-omie-gateway.js";
export { EstoqueFakeGateway } from "./infrastructure/gateways/estoque-fake-gateway.js";

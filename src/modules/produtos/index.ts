export { produtosModuleTools } from "./produtos-register.js";
export type {
  IProdutosGateway,
  ProdutoOmie,
  ListarProdutosResponse,
} from "./domain/interfaces/produtos-gateway.js";
export { ProdutosOmieGateway } from "./infrastructure/gateways/produtos-omie-gateway.js";
export { ProdutosFakeGateway } from "./infrastructure/gateways/produtos-fake-gateway.js";

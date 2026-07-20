export { estruturaModuleTools } from "./estrutura-register.js";
export type {
  IEstruturaGateway,
  EstruturaProdutoOmie,
  ListarEstruturasResponse,
} from "./domain/interfaces/estrutura-gateway.js";
export { EstruturaOmieGateway } from "./infrastructure/gateways/estrutura-omie-gateway.js";
export { EstruturaFakeGateway } from "./infrastructure/gateways/estrutura-fake-gateway.js";

export { servicosModuleTools } from "./servicos-register.js";
export type { IServicoGateway, ServicoOmie } from "./domain/interfaces/servico-gateway.js";
export type {
  IOrdemServicoGateway,
  OrdemServicoOmie,
} from "./domain/interfaces/ordem-servico-gateway.js";
export type { INfseGateway } from "./domain/interfaces/nfse-gateway.js";
export { ServicoOmieGateway } from "./infrastructure/gateways/servico-omie-gateway.js";
export { ServicoFakeGateway } from "./infrastructure/gateways/servico-fake-gateway.js";
export { OrdemServicoOmieGateway } from "./infrastructure/gateways/ordem-servico-omie-gateway.js";
export { OrdemServicoFakeGateway } from "./infrastructure/gateways/ordem-servico-fake-gateway.js";
export { NfseOmieGateway } from "./infrastructure/gateways/nfse-omie-gateway.js";
export { NfseFakeGateway } from "./infrastructure/gateways/nfse-fake-gateway.js";

export { contasCorrentesModuleTools } from "./contasCorrentes-register.js";
export type {
  IContasCorrentesGateway,
  ContaCorrenteOmie,
} from "./domain/interfaces/contas-correntes-gateway.js";
export { ContasCorrentesOmieGateway } from "./infrastructure/gateways/contas-correntes-omie-gateway.js";
export { ContasCorrentesFakeGateway } from "./infrastructure/gateways/contas-correntes-fake-gateway.js";

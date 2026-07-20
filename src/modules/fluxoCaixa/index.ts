export { fluxoCaixaModuleTools } from "./fluxoCaixa-register.js";
export type {
  IFinancasGateway,
  MovimentoFinanceiro,
  FiltroMovimentos,
} from "./domain/interfaces/financas-gateway.js";
export { FinancasOmieGateway } from "./infrastructure/gateways/financas-omie-gateway.js";
export { FinancasFakeGateway } from "./infrastructure/gateways/financas-fake-gateway.js";

import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { IFinancasGateway } from "../../domain/interfaces/financas-gateway.js";
import { FinancasFakeGateway } from "./financas-fake-gateway.js";
import { FinancasOmieGateway } from "./financas-omie-gateway.js";

export function criarFinancasGateway(client: OmieClient): IFinancasGateway {
  return process.env.OMIE_MOCK === "true"
    ? new FinancasFakeGateway()
    : new FinancasOmieGateway(client);
}

export { criarContasCorrentesGateway } from "../../../contasCorrentes/infrastructure/gateways/contas-correntes-gateway-factory.js";

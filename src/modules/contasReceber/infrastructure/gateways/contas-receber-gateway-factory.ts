import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { IContasReceberGateway } from "../../domain/interfaces/contas-receber-gateway.js";
import { ContasReceberFakeGateway } from "./contas-receber-fake-gateway.js";
import { ContasReceberOmieGateway } from "./contas-receber-omie-gateway.js";

export function criarContasReceberGateway(client: OmieClient): IContasReceberGateway {
  return process.env.OMIE_MOCK === "true"
    ? new ContasReceberFakeGateway()
    : new ContasReceberOmieGateway(client);
}

export { criarClientesGateway } from "../../../clientesFornecedores/infrastructure/gateways/clientes-gateway-factory.js";

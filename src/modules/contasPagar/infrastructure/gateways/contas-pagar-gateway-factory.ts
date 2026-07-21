import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { IContasPagarGateway } from "../../domain/interfaces/contas-pagar-gateway.js";
import { ContasPagarFakeGateway } from "./contas-pagar-fake-gateway.js";
import { ContasPagarOmieGateway } from "./contas-pagar-omie-gateway.js";

export function criarContasPagarGateway(client: OmieClient): IContasPagarGateway {
  return process.env.OMIE_MOCK === "true"
    ? new ContasPagarFakeGateway()
    : new ContasPagarOmieGateway(client);
}

export { criarClientesGateway } from "../../../clientesFornecedores/infrastructure/gateways/clientes-gateway-factory.js";

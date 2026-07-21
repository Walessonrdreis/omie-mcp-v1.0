import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { IContasCorrentesGateway } from "../../domain/interfaces/contas-correntes-gateway.js";
import { ContasCorrentesFakeGateway } from "./contas-correntes-fake-gateway.js";
import { ContasCorrentesOmieGateway } from "./contas-correntes-omie-gateway.js";

export function criarContasCorrentesGateway(client: OmieClient): IContasCorrentesGateway {
  return process.env.OMIE_MOCK === "true"
    ? new ContasCorrentesFakeGateway()
    : new ContasCorrentesOmieGateway(client);
}

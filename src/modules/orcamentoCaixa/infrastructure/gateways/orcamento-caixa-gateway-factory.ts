import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { IOrcamentoCaixaGateway } from "../../domain/interfaces/orcamento-caixa-gateway.js";
import { OrcamentoCaixaFakeGateway } from "./orcamento-caixa-fake-gateway.js";
import { OrcamentoCaixaOmieGateway } from "./orcamento-caixa-omie-gateway.js";

export function criarGateway(client: OmieClient): IOrcamentoCaixaGateway {
  return process.env.OMIE_MOCK === "true"
    ? new OrcamentoCaixaFakeGateway()
    : new OrcamentoCaixaOmieGateway(client);
}

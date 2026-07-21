import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { IEstoqueGateway } from "../../domain/interfaces/estoque-gateway.js";
import { EstoqueFakeGateway } from "./estoque-fake-gateway.js";
import { EstoqueOmieGateway } from "./estoque-omie-gateway.js";

export function criarEstoqueGateway(client: OmieClient): IEstoqueGateway {
  return process.env.OMIE_MOCK === "true"
    ? new EstoqueFakeGateway()
    : new EstoqueOmieGateway(client);
}

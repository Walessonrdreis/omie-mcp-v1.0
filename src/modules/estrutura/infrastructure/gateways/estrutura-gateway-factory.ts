import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { IEstruturaGateway } from "../../domain/interfaces/estrutura-gateway.js";
import { EstruturaFakeGateway } from "./estrutura-fake-gateway.js";
import { EstruturaOmieGateway } from "./estrutura-omie-gateway.js";

export function criarEstruturaGateway(client: OmieClient): IEstruturaGateway {
  return process.env.OMIE_MOCK === "true"
    ? new EstruturaFakeGateway()
    : new EstruturaOmieGateway(client);
}

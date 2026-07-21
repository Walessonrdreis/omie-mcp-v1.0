import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { INotaEntradaGateway } from "../../domain/interfaces/nota-entrada-gateway.js";
import { NotaEntradaFakeGateway } from "./nota-entrada-fake-gateway.js";
import { NotaEntradaOmieGateway } from "./nota-entrada-omie-gateway.js";

export function criarNotaEntradaGateway(client: OmieClient): INotaEntradaGateway {
  return process.env.OMIE_MOCK === "true" ? new NotaEntradaFakeGateway() : new NotaEntradaOmieGateway(client);
}

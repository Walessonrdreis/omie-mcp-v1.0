import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { ICaracteristicaGateway } from "../../domain/interfaces/caracteristica-gateway.js";
import { CaracteristicaFakeGateway } from "./caracteristica-fake-gateway.js";
import { CaracteristicaOmieGateway } from "./caracteristica-omie-gateway.js";

export function criarGateway(client: OmieClient): ICaracteristicaGateway {
  return process.env.OMIE_MOCK === "true"
    ? new CaracteristicaFakeGateway()
    : new CaracteristicaOmieGateway(client);
}

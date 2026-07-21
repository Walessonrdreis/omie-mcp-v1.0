import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { IPixGateway } from "../../domain/interfaces/pix-gateway.js";
import { PixFakeGateway } from "./pix-fake-gateway.js";
import { PixOmieGateway } from "./pix-omie-gateway.js";

export function criarPixGateway(client: OmieClient): IPixGateway {
  return process.env.OMIE_MOCK === "true" ? new PixFakeGateway() : new PixOmieGateway(client);
}

import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { INfeGateway } from "../../domain/interfaces/nfe-gateway.js";
import { NfeFakeGateway } from "./nfe-fake-gateway.js";
import { NfeOmieGateway } from "./nfe-omie-gateway.js";

export function criarNfeGateway(client: OmieClient): INfeGateway {
  return process.env.OMIE_MOCK === "true" ? new NfeFakeGateway() : new NfeOmieGateway(client);
}

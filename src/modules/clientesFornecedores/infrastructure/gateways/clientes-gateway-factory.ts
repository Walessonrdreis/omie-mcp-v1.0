import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { IClientesGateway } from "../../domain/interfaces/clientes-gateway.js";
import { ClientesFakeGateway } from "./clientes-fake-gateway.js";
import { ClientesOmieGateway } from "./clientes-omie-gateway.js";

export function criarClientesGateway(client: OmieClient): IClientesGateway {
  return process.env.OMIE_MOCK === "true"
    ? new ClientesFakeGateway()
    : new ClientesOmieGateway(client);
}

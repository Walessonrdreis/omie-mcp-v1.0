import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { IContaGateway } from "../../domain/interfaces/conta-gateway.js";
import { IContatoGateway } from "../../domain/interfaces/contato-gateway.js";
import { IOportunidadeGateway } from "../../domain/interfaces/oportunidade-gateway.js";
import { ICrmAuxiliarGateway } from "../../domain/interfaces/crm-auxiliar-gateway.js";
import { ContaFakeGateway } from "./conta-fake-gateway.js";
import { ContaOmieGateway } from "./conta-omie-gateway.js";
import { ContatoFakeGateway } from "./contato-fake-gateway.js";
import { ContatoOmieGateway } from "./contato-omie-gateway.js";
import { OportunidadeFakeGateway } from "./oportunidade-fake-gateway.js";
import { OportunidadeOmieGateway } from "./oportunidade-omie-gateway.js";
import { CrmAuxiliarFakeGateway } from "./crm-auxiliar-fake-gateway.js";
import { CrmAuxiliarOmieGateway } from "./crm-auxiliar-omie-gateway.js";

const mock = () => process.env.OMIE_MOCK === "true";

export function criarContaGateway(client: OmieClient): IContaGateway {
  return mock() ? new ContaFakeGateway() : new ContaOmieGateway(client);
}

export function criarContatoGateway(client: OmieClient): IContatoGateway {
  return mock() ? new ContatoFakeGateway() : new ContatoOmieGateway(client);
}

export function criarOportunidadeGateway(client: OmieClient): IOportunidadeGateway {
  return mock() ? new OportunidadeFakeGateway() : new OportunidadeOmieGateway(client);
}

export function criarCrmAuxiliarGateway(client: OmieClient): ICrmAuxiliarGateway {
  return mock() ? new CrmAuxiliarFakeGateway() : new CrmAuxiliarOmieGateway(client);
}

import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { IServicoGateway } from "../../domain/interfaces/servico-gateway.js";
import { IOrdemServicoGateway } from "../../domain/interfaces/ordem-servico-gateway.js";
import { INfseGateway } from "../../domain/interfaces/nfse-gateway.js";
import { ServicoFakeGateway } from "./servico-fake-gateway.js";
import { ServicoOmieGateway } from "./servico-omie-gateway.js";
import { OrdemServicoFakeGateway } from "./ordem-servico-fake-gateway.js";
import { OrdemServicoOmieGateway } from "./ordem-servico-omie-gateway.js";
import { NfseFakeGateway } from "./nfse-fake-gateway.js";
import { NfseOmieGateway } from "./nfse-omie-gateway.js";

export function criarServicoGateway(client: OmieClient): IServicoGateway {
  return process.env.OMIE_MOCK === "true" ? new ServicoFakeGateway() : new ServicoOmieGateway(client);
}

export function criarOrdemServicoGateway(client: OmieClient): IOrdemServicoGateway {
  return process.env.OMIE_MOCK === "true"
    ? new OrdemServicoFakeGateway()
    : new OrdemServicoOmieGateway(client);
}

export function criarNfseGateway(client: OmieClient): INfseGateway {
  return process.env.OMIE_MOCK === "true" ? new NfseFakeGateway() : new NfseOmieGateway(client);
}

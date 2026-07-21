import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { ICategoriaGateway } from "../../domain/interfaces/categoria-gateway.js";
import { IDepartamentoGateway } from "../../domain/interfaces/departamento-gateway.js";
import { CategoriaFakeGateway } from "./categoria-fake-gateway.js";
import { CategoriaOmieGateway } from "./categoria-omie-gateway.js";
import { DepartamentoFakeGateway } from "./departamento-fake-gateway.js";
import { DepartamentoOmieGateway } from "./departamento-omie-gateway.js";

export function criarCategoriaGateway(client: OmieClient): ICategoriaGateway {
  return process.env.OMIE_MOCK === "true" ? new CategoriaFakeGateway() : new CategoriaOmieGateway(client);
}

export function criarDepartamentoGateway(client: OmieClient): IDepartamentoGateway {
  return process.env.OMIE_MOCK === "true" ? new DepartamentoFakeGateway() : new DepartamentoOmieGateway(client);
}

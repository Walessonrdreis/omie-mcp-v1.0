import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { ICadastrosAuxiliaresGateway } from "../../domain/interfaces/cadastros-auxiliares-gateway.js";
import { CadastrosAuxiliaresFakeGateway } from "./cadastros-auxiliares-fake-gateway.js";
import { CadastrosAuxiliaresOmieGateway } from "./cadastros-auxiliares-omie-gateway.js";

export function criarCadastrosAuxiliaresGateway(client: OmieClient): ICadastrosAuxiliaresGateway {
  return process.env.OMIE_MOCK === "true"
    ? new CadastrosAuxiliaresFakeGateway()
    : new CadastrosAuxiliaresOmieGateway(client);
}

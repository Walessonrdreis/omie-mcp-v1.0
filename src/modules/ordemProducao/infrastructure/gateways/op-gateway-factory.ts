import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { IOrdemProducaoGateway } from "../../domain/interfaces/op-gateway.js";
import { OpFakeGateway } from "./op-fake-gateway.js";
import { OpOmieGateway } from "./op-omie-gateway.js";

export function criarOpGateway(client: OmieClient): IOrdemProducaoGateway {
  return process.env.OMIE_MOCK === "true" ? new OpFakeGateway() : new OpOmieGateway(client);
}

export { criarProdutosGateway } from "../../../produtos/infrastructure/gateways/produtos-gateway-factory.js";

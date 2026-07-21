import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { IProdutosGateway } from "../../domain/interfaces/produtos-gateway.js";
import { ProdutosFakeGateway } from "./produtos-fake-gateway.js";
import { ProdutosOmieGateway } from "./produtos-omie-gateway.js";

export function criarProdutosGateway(client: OmieClient): IProdutosGateway {
  return process.env.OMIE_MOCK === "true"
    ? new ProdutosFakeGateway()
    : new ProdutosOmieGateway(client);
}

export { criarEstoqueGateway } from "../../../estoque/infrastructure/gateways/estoque-gateway-factory.js";

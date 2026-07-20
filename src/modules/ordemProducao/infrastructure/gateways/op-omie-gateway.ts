import { OmieClient } from "../../../../omieClient.js";
import {
  IOrdemProducaoGateway,
  ListarOrdemProducaoResponse,
} from "../../domain/interfaces/op-gateway.js";

export { OrdemProducao } from "../../domain/interfaces/op-gateway.js";

export class OpOmieGateway implements IOrdemProducaoGateway {
  constructor(private readonly client: OmieClient) {}

  async listarOrdensPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarOrdemProducaoResponse> {
    return this.client.call<ListarOrdemProducaoResponse>({
      resource: "produtos/op",
      call: "ListarOrdemProducao",
      param: { pagina, registros_por_pagina: registrosPorPagina },
    });
  }
}

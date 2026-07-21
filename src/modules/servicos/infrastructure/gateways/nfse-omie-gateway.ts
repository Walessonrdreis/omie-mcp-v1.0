import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import {
  INfseGateway,
  ListarLC116Response,
  ListarNFSePageParams,
  ListarNFSeResponse,
} from "../../domain/interfaces/nfse-gateway.js";

export class NfseOmieGateway implements INfseGateway {
  constructor(private readonly client: OmieClient) {}

  async listarNFSePagina(params: ListarNFSePageParams): Promise<ListarNFSeResponse> {
    return this.client.call<ListarNFSeResponse>({
      resource: "servicos/nfse",
      call: "ListarNFSEs",
      param: {
        nPagina: params.pagina,
        nRegPorPagina: params.registrosPorPagina,
        ...(params.emissaoDe ? { dEmiInicial: params.emissaoDe } : {}),
        ...(params.emissaoAte ? { dEmiFinal: params.emissaoAte } : {}),
      },
    });
  }

  async listarCodigosLC116Pagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarLC116Response> {
    return this.client.call<ListarLC116Response>({
      resource: "servicos/lc116",
      call: "ListarLC116",
      param: { pagina, registros_por_pagina: registrosPorPagina },
    });
  }
}

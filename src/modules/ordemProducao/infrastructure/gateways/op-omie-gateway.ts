import { OmieClient } from "../../../../omieClient.js";
import {
  ChaveOP,
  DadosOPParaGravar,
  IOrdemProducaoGateway,
  ListarOrdemProducaoResponse,
  OrdemProducaoDetalhada,
  StatusOPOmie,
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

  async consultarOP(chave: ChaveOP): Promise<OrdemProducaoDetalhada> {
    return this.client.call<OrdemProducaoDetalhada>({
      resource: "produtos/op",
      call: "ConsultarOrdemProducao",
      param: { ...chave },
    });
  }

  async incluirOP(dados: DadosOPParaGravar): Promise<StatusOPOmie> {
    return this.client.call<StatusOPOmie>({
      resource: "produtos/op",
      call: "IncluirOrdemProducao",
      param: { identificacao: { ...dados } },
    });
  }

  async alterarOP(dados: DadosOPParaGravar): Promise<StatusOPOmie> {
    return this.client.call<StatusOPOmie>({
      resource: "produtos/op",
      call: "AlterarOrdemProducao",
      param: { identificacao: { ...dados } },
    });
  }

  async excluirOP(chave: ChaveOP): Promise<StatusOPOmie> {
    return this.client.call<StatusOPOmie>({
      resource: "produtos/op",
      call: "ExcluirOrdemProducao",
      param: { ...chave },
    });
  }
}

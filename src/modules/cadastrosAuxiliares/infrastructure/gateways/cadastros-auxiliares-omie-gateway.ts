import { OmieClient } from "../../../../omieClient.js";
import {
  ICadastrosAuxiliaresGateway,
  ListarBancosParams,
  ListarBancosResponse,
  ListarCidadesParams,
  ListarCidadesResponse,
  ListarNCMParams,
  ListarNCMResponse,
  ListarPaisesParams,
  ListarPaisesResponse,
  UnidadeOmie,
} from "../../domain/interfaces/cadastros-auxiliares-gateway.js";

export class CadastrosAuxiliaresOmieGateway implements ICadastrosAuxiliaresGateway {
  constructor(private readonly client: OmieClient) {}

  async listarBancos(params: ListarBancosParams): Promise<ListarBancosResponse> {
    return this.client.call<ListarBancosResponse>({
      resource: "geral/bancos",
      call: "ListarBancos",
      param: {
        pagina: params.pagina,
        registros_por_pagina: params.registrosPorPagina,
        ...(params.nome ? { nome: params.nome } : {}),
      },
    });
  }

  async listarCidades(params: ListarCidadesParams): Promise<ListarCidadesResponse> {
    return this.client.call<ListarCidadesResponse>({
      resource: "geral/cidades",
      call: "PesquisarCidades",
      param: {
        pagina: params.pagina,
        registros_por_pagina: params.registrosPorPagina,
        ...(params.uf ? { filtrar_por_uf: params.uf } : {}),
        ...(params.contendo ? { filtrar_cidade_contendo: params.contendo } : {}),
      },
    });
  }

  async listarPaises(params: ListarPaisesParams): Promise<ListarPaisesResponse> {
    return this.client.call<ListarPaisesResponse>({
      resource: "geral/paises",
      call: "ListarPaises",
      param: {
        filtrar_por_codigo_iso: params.codigoIso ?? "",
        filtrar_por_descricao: params.descricao ?? "",
      },
    });
  }

  async listarNCM(params: ListarNCMParams): Promise<ListarNCMResponse> {
    return this.client.call<ListarNCMResponse>({
      resource: "produtos/ncm",
      call: "ListarNCM",
      param: {
        nPagina: params.pagina,
        nRegPorPagina: params.registrosPorPagina,
        ...(params.codigo ? { cCodigo: params.codigo } : {}),
        ...(params.descricao ? { cDescricao: params.descricao } : {}),
      },
    });
  }

  async consultarUnidade(codigo: string): Promise<UnidadeOmie> {
    const resposta = await this.client.call<{ unidade_cadastro: UnidadeOmie[] }>({
      resource: "geral/unidade",
      call: "ListarUnidades",
      param: { codigo },
    });
    return resposta.unidade_cadastro[0];
  }
}

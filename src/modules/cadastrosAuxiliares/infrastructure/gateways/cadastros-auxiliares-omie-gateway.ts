import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { chaveCache, comCache } from "../../../../shared/cache.js";
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
    const resource = "geral/bancos";
    const call = "ListarBancos";
    const param = {
      pagina: params.pagina,
      registros_por_pagina: params.registrosPorPagina,
      ...(params.nome ? { nome: params.nome } : {}),
    };
    return comCache(chaveCache(resource, call, param), () =>
      this.client.call<ListarBancosResponse>({ resource, call, param })
    );
  }

  async listarCidades(params: ListarCidadesParams): Promise<ListarCidadesResponse> {
    const resource = "geral/cidades";
    const call = "PesquisarCidades";
    const param = {
      pagina: params.pagina,
      registros_por_pagina: params.registrosPorPagina,
      ...(params.uf ? { filtrar_por_uf: params.uf } : {}),
      ...(params.contendo ? { filtrar_cidade_contendo: params.contendo } : {}),
    };
    return comCache(chaveCache(resource, call, param), () =>
      this.client.call<ListarCidadesResponse>({ resource, call, param })
    );
  }

  async listarPaises(params: ListarPaisesParams): Promise<ListarPaisesResponse> {
    const resource = "geral/paises";
    const call = "ListarPaises";
    const param = {
      filtrar_por_codigo_iso: params.codigoIso ?? "",
      filtrar_por_descricao: params.descricao ?? "",
    };
    return comCache(chaveCache(resource, call, param), () =>
      this.client.call<ListarPaisesResponse>({ resource, call, param })
    );
  }

  async listarNCM(params: ListarNCMParams): Promise<ListarNCMResponse> {
    const resource = "produtos/ncm";
    const call = "ListarNCM";
    const param = {
      nPagina: params.pagina,
      nRegPorPagina: params.registrosPorPagina,
      ...(params.codigo ? { cCodigo: params.codigo } : {}),
      ...(params.descricao ? { cDescricao: params.descricao } : {}),
    };
    return comCache(chaveCache(resource, call, param), () =>
      this.client.call<ListarNCMResponse>({ resource, call, param })
    );
  }

  async consultarUnidade(codigo: string): Promise<UnidadeOmie> {
    const resource = "geral/unidade";
    const call = "ListarUnidades";
    const param = { codigo };
    const resposta = await comCache(chaveCache(resource, call, param), () =>
      this.client.call<{ unidade_cadastro: UnidadeOmie[] }>({ resource, call, param })
    );
    return resposta.unidade_cadastro[0];
  }
}

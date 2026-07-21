import { OmieClient } from "../../../../omieClient.js";
import {
  CategoriaOmie,
  CategoriaParaAlterar,
  CategoriaParaIncluir,
  ICategoriaGateway,
  ListarCategoriasPageParams,
  ListarCategoriasResponse,
  StatusCategoria,
} from "../../domain/interfaces/categoria-gateway.js";

export class CategoriaOmieGateway implements ICategoriaGateway {
  constructor(private readonly client: OmieClient) {}

  async incluirCategoria(dados: CategoriaParaIncluir): Promise<StatusCategoria> {
    const resposta = await this.client.call<{
      codigo: string;
      codigo_status: string;
      descricao_status: string;
    }>({
      resource: "geral/categorias",
      call: "IncluirCategoria",
      param: { categoria_superior: dados.categoriaSuperior, descricao: dados.descricao },
    });

    return {
      codigo: resposta.codigo,
      codigoStatus: resposta.codigo_status,
      descricaoStatus: resposta.descricao_status,
    };
  }

  async alterarCategoria(dados: CategoriaParaAlterar): Promise<StatusCategoria> {
    const resposta = await this.client.call<{
      codigo: string;
      codigo_status: string;
      descricao_status: string;
    }>({
      resource: "geral/categorias",
      call: "AlterarCategoria",
      param: {
        codigo: dados.codigo,
        ...(dados.descricao !== undefined ? { descricao: dados.descricao } : {}),
      },
    });

    return {
      codigo: resposta.codigo,
      codigoStatus: resposta.codigo_status,
      descricaoStatus: resposta.descricao_status,
    };
  }

  async consultarCategoria(codigo: string): Promise<CategoriaOmie> {
    return this.client.call<CategoriaOmie>({
      resource: "geral/categorias",
      call: "ConsultarCategoria",
      param: { codigo },
    });
  }

  async listarCategoriasPagina(params: ListarCategoriasPageParams): Promise<ListarCategoriasResponse> {
    return this.client.call<ListarCategoriasResponse>({
      resource: "geral/categorias",
      call: "ListarCategorias",
      param: { pagina: params.pagina, registros_por_pagina: params.registrosPorPagina },
    });
  }
}

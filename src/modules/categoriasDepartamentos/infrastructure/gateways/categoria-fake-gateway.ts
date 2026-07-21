import {
  CategoriaOmie,
  CategoriaParaAlterar,
  CategoriaParaIncluir,
  ICategoriaGateway,
  ListarCategoriasPageParams,
  ListarCategoriasResponse,
  StatusCategoria,
} from "../../domain/interfaces/categoria-gateway.js";

export class CategoriaFakeGateway implements ICategoriaGateway {
  private proximoSufixo = 1;
  private readonly categorias = new Map<string, CategoriaOmie>();

  async incluirCategoria(dados: CategoriaParaIncluir): Promise<StatusCategoria> {
    const codigo = `${dados.categoriaSuperior}.${String(this.proximoSufixo++).padStart(2, "0")}`;
    this.categorias.set(codigo, {
      codigo,
      descricao: dados.descricao,
      categoria_superior: dados.categoriaSuperior,
      conta_despesa: "S",
      conta_receita: "N",
      conta_inativa: "N",
      totalizadora: "N",
    });

    return { codigo, codigoStatus: "0", descricaoStatus: "Categoria cadastrada com sucesso! (fake)" };
  }

  private encontrar(codigo: string): CategoriaOmie {
    const categoria = this.categorias.get(codigo);
    if (!categoria) throw new Error(`Categoria ${codigo} não encontrada (fake).`);
    return categoria;
  }

  async alterarCategoria(dados: CategoriaParaAlterar): Promise<StatusCategoria> {
    const categoria = this.encontrar(dados.codigo);
    if (dados.descricao !== undefined) categoria.descricao = dados.descricao;

    return { codigo: categoria.codigo, codigoStatus: "0", descricaoStatus: "Categoria alterada com sucesso! (fake)" };
  }

  async consultarCategoria(codigo: string): Promise<CategoriaOmie> {
    return this.encontrar(codigo);
  }

  async listarCategoriasPagina(params: ListarCategoriasPageParams): Promise<ListarCategoriasResponse> {
    const todas = Array.from(this.categorias.values());
    const inicio = (params.pagina - 1) * params.registrosPorPagina;
    const pagina = todas.slice(inicio, inicio + params.registrosPorPagina);

    return {
      pagina: params.pagina,
      total_de_paginas: Math.max(1, Math.ceil(todas.length / params.registrosPorPagina)),
      registros: pagina.length,
      total_de_registros: todas.length,
      categoria_cadastro: pagina,
    };
  }
}

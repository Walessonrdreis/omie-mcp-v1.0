import { IProdutosHttpClient, ListarProdutosResponseBruto } from "../domain/produtos-http-client.js";
import { ProdutoOmieBruto } from "../modules/produtos/domain/produto.js";
import { IEstoqueHttpClient, ListarPosEstoqueResponseBruto } from "../domain/estoque-http-client.js";
import { PosicaoEstoqueOmieBruta } from "../modules/estoque/domain/estoque.js";
import { IOrdemProducaoHttpClient, ListarOrdemProducaoResponseBruto } from "../domain/ordem-producao-http-client.js";
import { OrdemProducaoOmieBruta } from "../modules/ordemProducao/domain/ordem-producao.js";

export class FakeHttpClient implements IProdutosHttpClient, IEstoqueHttpClient, IOrdemProducaoHttpClient {
  constructor(
    private readonly produtos: ProdutoOmieBruto[] = [],
    private readonly posicoesEstoque: PosicaoEstoqueOmieBruta[] = [],
    private readonly ordensProducao: OrdemProducaoOmieBruta[] = []
  ) {}

  async listarProdutosPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarProdutosResponseBruto> {
    const inicio = (pagina - 1) * registrosPorPagina;
    const fatia = this.produtos.slice(inicio, inicio + registrosPorPagina);
    const totalPaginas = Math.max(1, Math.ceil(this.produtos.length / registrosPorPagina));

    return {
      pagina,
      total_de_paginas: totalPaginas,
      produto_servico_cadastro: fatia,
    };
  }

  async listarPosicoesEstoquePagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarPosEstoqueResponseBruto> {
    const inicio = (pagina - 1) * registrosPorPagina;
    const fatia = this.posicoesEstoque.slice(inicio, inicio + registrosPorPagina);
    const totalPaginas = Math.max(1, Math.ceil(this.posicoesEstoque.length / registrosPorPagina));

    return {
      nPagina: pagina,
      nTotPaginas: totalPaginas,
      nTotRegistros: this.posicoesEstoque.length,
      produtos: fatia,
    };
  }

  async listarOrdensProducaoPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarOrdemProducaoResponseBruto> {
    const inicio = (pagina - 1) * registrosPorPagina;
    const fatia = this.ordensProducao.slice(inicio, inicio + registrosPorPagina);
    const totalPaginas = Math.max(1, Math.ceil(this.ordensProducao.length / registrosPorPagina));

    return {
      pagina,
      total_de_paginas: totalPaginas,
      registros: fatia.length,
      total_de_registros: this.ordensProducao.length,
      cadastros: fatia,
    };
  }
}

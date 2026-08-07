import { IProdutosHttpClient, ListarProdutosResponseBruto } from "../domain/produtos-http-client.js";
import { ProdutoOmieBruto } from "../modules/produtos/domain/produto.js";

export class FakeHttpClient implements IProdutosHttpClient {
  constructor(private readonly produtos: ProdutoOmieBruto[]) {}

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
}

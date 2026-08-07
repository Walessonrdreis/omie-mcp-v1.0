import { ProdutoOmieBruto } from "../modules/produtos/domain/produto.js";

export interface ListarProdutosResponseBruto {
  pagina: number;
  total_de_paginas: number;
  produto_servico_cadastro: ProdutoOmieBruto[];
}

export interface IProdutosHttpClient {
  listarProdutosPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarProdutosResponseBruto>;
}

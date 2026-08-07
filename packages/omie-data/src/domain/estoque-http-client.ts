import { PosicaoEstoqueOmieBruta } from "../modules/estoque/domain/estoque.js";

export interface ListarPosEstoqueResponseBruto {
  pagina: number;
  total_de_paginas: number;
  pos_estoque: PosicaoEstoqueOmieBruta[];
}

export interface IEstoqueHttpClient {
  listarPosicoesEstoquePagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarPosEstoqueResponseBruto>;
}

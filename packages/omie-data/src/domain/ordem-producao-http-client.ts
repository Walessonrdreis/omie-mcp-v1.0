import { OrdemProducaoOmieBruta } from "../modules/ordemProducao/domain/ordem-producao.js";

export interface ListarOrdemProducaoResponseBruto {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  cadastros: OrdemProducaoOmieBruta[];
}

export interface IOrdemProducaoHttpClient {
  listarOrdensProducaoPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarOrdemProducaoResponseBruto>;
}

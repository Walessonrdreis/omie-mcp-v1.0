import { PosicaoEstoqueOmieBruta } from "../modules/estoque/domain/estoque.js";

export interface ListarPosEstoqueResponseBruto {
  nPagina: number;
  nTotPaginas: number;
  nTotRegistros: number;
  produtos: PosicaoEstoqueOmieBruta[];
}

export interface IEstoqueHttpClient {
  listarPosicoesEstoquePagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarPosEstoqueResponseBruto>;
}

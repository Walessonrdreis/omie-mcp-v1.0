/** Uma posição de estoque como a Omie devolve em ListarPosEstoque. */
export interface PosicaoEstoqueOmieBruta {
  cCodigo: string;
  cDescricao: string;
  codigo_local_estoque: number;
  fisico: number;
  nCodProd: number;
  nSaldo: number;
  reservado: number;
  nPendente: number;
  nCMC: number;
}

/**
 * Uma posição de estoque de um produto em um local de estoque específico,
 * conforme devolvida pela Omie em `estoque/consulta` / `ListarPosEstoque`.
 */
export interface PosicaoEstoque {
  cCodigo: string;
  cDescricao: string;
  codigo_local_estoque: number;
  fisico: number;
  nCodProd: number;
  nSaldo: number;
  reservado: number;
  nPendente: number;
  /** Custo médio (nCMC) do produto nesse local, usado pra calcular valor em estoque. */
  nCMC: number;
}

/**
 * Contrato de acesso a posições de estoque, independente de vir da Omie real
 * ou de um fake em memória (`OMIE_MOCK=true`).
 */
export interface IEstoqueGateway {
  /**
   * Varre TODAS as páginas de posição de estoque (todos os produtos, todos os
   * locais). Base pra qualquer relatório que precise cruzar estoque com outro
   * dado (ex: valor em estoque por produto, no módulo `produtos`).
   */
  listarTodasPosicoes(): Promise<PosicaoEstoque[]>;

  /**
   * Devolve apenas as posições do produto informado (em todos os locais de
   * estoque).
   */
  listarPosicoesPorProduto(codigoProduto: number): Promise<PosicaoEstoque[]>;
}

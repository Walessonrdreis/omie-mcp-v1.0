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
 * Motivo do ajuste — testado ao vivo: só esses 4 valores são aceitos pela
 * Omie (erro `SOAP-ENV:Client-105` lista exatamente essas opções, a doc
 * pública não documenta o enum). 'INI' = estoque inicial, 'INV' = inventário/
 * divergência, 'OPE' = operacional, 'PDV' = ponto de venda.
 */
export type MotivoAjusteEstoque = "INI" | "INV" | "OPE" | "PDV";

export interface DadosAjusteEstoqueParaGravar {
  id_prod: number;
  data: string;
  tipo: "ENT" | "SAI" | "SLD" | "TRF";
  quan: number;
  valor?: number;
  obs?: string;
  origem: "AJU" | "PDV";
  motivo: MotivoAjusteEstoque;
  codigo_local_estoque?: number;
  codigo_local_estoque_destino?: number;
}

export interface StatusAjusteEstoqueOmie {
  codigo_status: string;
  descricao_status: string;
  id_movest: number;
  id_ajuste: number;
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

  incluirAjuste(dados: DadosAjusteEstoqueParaGravar): Promise<StatusAjusteEstoqueOmie>;

  /**
   * Exclui um ajuste. Testado ao vivo: a Omie exclui o ajuste normalmente,
   * mas o "Movimento de Estoque (calculado)" resultante fica registrado pra
   * sempre no produto — depois de qualquer ajuste, o produto NUNCA MAIS pode
   * ser excluído (`ExcluirProduto` recusa com erro de dependência), mesmo com
   * o ajuste já excluído.
   */
  excluirAjuste(idAjuste: number): Promise<StatusAjusteEstoqueOmie>;
}

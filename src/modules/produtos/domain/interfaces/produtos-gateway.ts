export interface ProdutoOmie {
  codigo_produto: number;
  codigo: string;
  codigo_produto_integracao: string;
  descricao: string;
  unidade: string;
  valor_unitario: number;
  inativo: string;
  codigo_familia: number;
  descricao_familia?: string;
}

export interface ListarProdutosResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  produto_servico_cadastro: ProdutoOmie[];
}

/**
 * Contrato de acesso ao cadastro de produtos, independente de vir da Omie
 * real ou de um fake em memória (`OMIE_MOCK=true`).
 */
export interface IProdutosGateway {
  listarProdutosPagina(
    pagina: number,
    registrosPorPagina: number,
    codigoFamilia?: number
  ): Promise<ListarProdutosResponse>;

  consultarProduto(codigoProduto: number): Promise<ProdutoOmie>;

  /**
   * Busca vários produtos por código, deduplicando. Usado por outros módulos
   * (ex: `ordemProducao`) que recebem uma lista de códigos de produto (sem
   * descrição) e precisam enriquecer com o cadastro.
   */
  consultarProdutosPorCodigo(codigosProduto: number[]): Promise<Map<number, ProdutoOmie>>;
}

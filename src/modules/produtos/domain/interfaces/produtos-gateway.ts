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
 * Campos aceitos por `IncluirProduto`/`AlterarProduto`. Testado ao vivo contra
 * a API real: `codigo` (SKU) é obrigatório no Incluir, mesmo a doc pública da
 * Omie marcando como opcional.
 */
export interface DadosProdutoParaGravar {
  codigo_produto?: number;
  codigo_produto_integracao?: string;
  codigo: string;
  descricao: string;
  unidade: string;
  ncm?: string;
  valor_unitario?: number;
  ean?: string;
  codigo_familia?: number;
  tipoItem?: string;
  peso_liq?: number;
  peso_bruto?: number;
  marca?: string;
  modelo?: string;
}

/** Identifica um produto pra exclusão — só um dos três campos já basta. */
export interface ChaveProduto {
  codigo_produto?: number;
  codigo_produto_integracao?: string;
  codigo?: string;
}

export interface StatusProdutoOmie {
  codigo_produto: number;
  codigo_produto_integracao: string;
  codigo_status: string;
  descricao_status: string;
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

  incluirProduto(dados: DadosProdutoParaGravar): Promise<StatusProdutoOmie>;

  alterarProduto(chave: ChaveProduto, dados: Partial<DadosProdutoParaGravar>): Promise<StatusProdutoOmie>;

  excluirProduto(chave: ChaveProduto): Promise<StatusProdutoOmie>;
}

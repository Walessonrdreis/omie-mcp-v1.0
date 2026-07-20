/**
 * Item de insumo/componente dentro da estrutura (BOM/ficha técnica) de um
 * produto. A Omie já devolve descrição e unidade prontas aqui — diferente de
 * outros endpoints (ex: `ListarOrdemProducao`) que só trazem código cru.
 */
export interface ItemEstruturaOmie {
  idMalha: number;
  intMalha: string;
  idProdMalha: number;
  intProdMalha: string;
  codProdMalha: string;
  descrProdMalha: string;
  quantProdMalha: number;
  unidProdMalha: string;
  tipoProdMalha: string;
  idFamMalha: number;
  codFamMalha: string;
  descrFamMalha: string;
  pesoLiqProdMalha: number;
  pesoBrutoProdMalha: number;
  percPerdaProdMalha: number;
  obsProdMalha: string;
}

export interface EstruturaProdutoOmie {
  ident: {
    idProduto: number;
    intProduto: string;
    codProduto: string;
    descrProduto: string;
    tipoProduto: string;
    idFamilia: number;
    codFamilia: string;
    descrFamilia: string;
    unidProduto: string;
    pesoLiqProduto: number;
    pesoBrutoProduto: number;
  };
  observacoes?: {
    obsRelevantes: string;
  };
  itens: ItemEstruturaOmie[];
}

export interface ListarEstruturasResponse {
  nPagina: number;
  nTotPaginas: number;
  nRegistros: number;
  nTotRegistros: number;
  produtosEncontrados: EstruturaProdutoOmie[];
}

/**
 * Item novo pra incluir na estrutura. Testado ao vivo: `intMalha` é
 * obrigatório na Omie (mesmo a doc pública marcando como opcional) — é o
 * identificador do item dentro da malha, não do produto componente.
 */
export interface ItemEstruturaParaIncluir {
  intMalha: string;
  idProdMalha: number;
  quantProdMalha: number;
  percPerdaProdMalha?: number;
  obsProdMalha?: string;
}

/**
 * Alteração de um item já existente. Testado ao vivo: além do `idMalha`
 * (identifica o item), a Omie também exige `idProdMalha` (ou `intProdMalha`)
 * mesmo pra só alterar quantidade.
 */
export interface ItemEstruturaParaAlterar {
  idMalha: number;
  idProdMalha: number;
  quantProdMalha?: number;
  percPerdaProdMalha?: number;
  obsProdMalha?: string;
}

export interface ItemEstruturaStatus {
  codStatus: string;
  descrStatus: string;
  idMalha: number;
  idProdMalha: number;
  intMalha: string;
  intProdMalha: string;
}

export interface AlterarIncluirEstruturaResponse {
  itemMalhaStatus: ItemEstruturaStatus[];
}

export interface ExcluirEstruturaStatus {
  idProduto: number;
  intProduto: string;
  idMalha: number;
  intMalha: string;
  codStatus: string;
  descrStatus: string;
}

/**
 * Contrato de acesso à estrutura (BOM/ficha técnica) de produtos, independente
 * de vir da Omie real ou de um fake em memória (`OMIE_MOCK=true`).
 */
export interface IEstruturaGateway {
  listarEstruturasPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarEstruturasResponse>;

  incluirItensEstrutura(
    idProduto: number,
    itens: ItemEstruturaParaIncluir[]
  ): Promise<AlterarIncluirEstruturaResponse>;

  alterarItensEstrutura(
    idProduto: number,
    itens: ItemEstruturaParaAlterar[]
  ): Promise<AlterarIncluirEstruturaResponse>;

  excluirItemEstrutura(idProduto: number, idMalha: number): Promise<ExcluirEstruturaStatus>;
}

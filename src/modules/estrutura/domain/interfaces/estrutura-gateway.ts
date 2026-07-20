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
 * Contrato de acesso à estrutura (BOM/ficha técnica) de produtos, independente
 * de vir da Omie real ou de um fake em memória (`OMIE_MOCK=true`).
 */
export interface IEstruturaGateway {
  listarEstruturasPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarEstruturasResponse>;
}

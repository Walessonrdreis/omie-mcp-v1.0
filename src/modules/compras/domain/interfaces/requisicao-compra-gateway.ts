export interface ItemRequisicaoCompra {
  codIntItem: string;
  codProduto: number;
  quantidade: number;
  precoUnitario?: number;
}

export interface RequisicaoCompraParaIncluir {
  codIntReqCompra: string;
  codigoCategoria: string;
  dataSugestao: string;
  itens: ItemRequisicaoCompra[];
}

export interface RequisicaoCompraParaAlterar {
  codigoRequisicao: number;
  codigoCategoria?: string;
  dataSugestao?: string;
  itens?: ItemRequisicaoCompra[];
}

export interface StatusRequisicaoCompra {
  codigoRequisicao: number;
  codIntReqCompra: string;
  codigoStatus: string;
  descricaoStatus: string;
}

interface ItemRequisicaoCompraOmie {
  codIntItem: string;
  codProd: number;
  qtde: number;
  precoUnit: number;
}

export interface RequisicaoCompraOmie {
  codReqCompra: number;
  codIntReqCompra: string;
  codCateg: string;
  dtSugestao: string;
  ItensReqCompra: ItemRequisicaoCompraOmie[];
}

export interface ListarRequisicoesCompraResponse {
  total_de_paginas: number;
  total_de_registros: number;
  requisicaoCadastro: RequisicaoCompraOmie[];
}

export interface ListarRequisicoesCompraPageParams {
  pagina: number;
  registrosPorPagina: number;
}

/**
 * Contrato de acesso a Requisição de Compra (`produtos/requisicaocompra`) da
 * Omie. Testado ao vivo: diferente de outros endpoints da Omie, os campos
 * de incluir/alterar vão direto na raiz do `param` — não existe wrapper tipo
 * `requisicaoCadastro: {...}` como a doc pública sugere (a Omie recusa com
 * "Tag [REQUISICAOCADASTRO] não faz parte da estrutura").
 */
export interface IRequisicaoCompraGateway {
  incluirRequisicao(dados: RequisicaoCompraParaIncluir): Promise<StatusRequisicaoCompra>;
  alterarRequisicao(dados: RequisicaoCompraParaAlterar): Promise<StatusRequisicaoCompra>;
  excluirRequisicao(codigoRequisicao: number): Promise<StatusRequisicaoCompra>;
  consultarRequisicao(codigoRequisicao: number): Promise<RequisicaoCompraOmie>;
  listarRequisicoesPagina(
    params: ListarRequisicoesCompraPageParams
  ): Promise<ListarRequisicoesCompraResponse>;
}

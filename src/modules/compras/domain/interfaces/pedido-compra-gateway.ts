/**
 * Item de um pedido de compra, tanto pra incluir/alterar quanto no retorno de
 * consulta. A Omie devolve/aceita bem mais campos (impostos, frete
 * proporcional etc.) — aqui só os essenciais pro caso de uso do MCP.
 */
export interface ItemPedidoCompra {
  codIntItem: string;
  codProduto: number;
  quantidade: number;
  valorUnitario: number;
}

export interface PedidoCompraParaIncluir {
  codIntPed: string;
  dataPrevisao: string;
  quantidadeParcelas: number;
  codigoFornecedor: number;
  /**
   * Testado ao vivo: apesar do nome sugerir centro de custo/departamento, a
   * Omie exige aqui um código de CONTA CORRENTE (`geral/contacorrente`), não
   * um código de `geral/departamentos` — erro "Conta Corrente não cadastrada"
   * quando um código de departamento é usado.
   */
  codigoContaCorrente: number;
  codigoCategoria?: string;
  itens: ItemPedidoCompra[];
}

export interface PedidoCompraParaAlterar {
  codigoPedido: number;
  quantidadeParcelas?: number;
  itens?: ItemPedidoCompra[];
}

export interface StatusPedidoCompra {
  codigoPedido: number;
  codIntPed: string;
  codigoStatus: string;
  descricaoStatus: string;
  numero?: string;
}

interface CabecalhoPedidoCompraOmie {
  nCodPed: number;
  cCodIntPed: string;
  cNumero: string;
  dDtPrevisao: string;
  nQtdeParc: number;
  nCodFor: number;
  nCodCC: number;
  cCodCateg: string;
  cEtapa: string;
}

interface ItemPedidoCompraOmie {
  cCodIntItem: string;
  nCodProd: number;
  cDescricao: string;
  nQtde: number;
  nValUnit: number;
  nValTot: number;
  nQtdeRec: number;
}

export interface PedidoCompraOmie {
  cabecalho_consulta: CabecalhoPedidoCompraOmie;
  produtos_consulta: ItemPedidoCompraOmie[];
}

export interface ListarPedidosCompraResponse {
  nTotalPaginas: number;
  nTotalRegistros: number;
  pedidos_pesquisa: {
    cabecalho_consulta: CabecalhoPedidoCompraOmie;
    produtos_consulta: ItemPedidoCompraOmie[];
  }[];
}

export interface ListarPedidosCompraPageParams {
  pagina: number;
  registrosPorPagina: number;
}

/**
 * Contrato de acesso a Pedido de Compra (`produtos/pedidocompra`) da Omie.
 */
export interface IPedidoCompraGateway {
  incluirPedido(dados: PedidoCompraParaIncluir): Promise<StatusPedidoCompra>;
  alterarPedido(dados: PedidoCompraParaAlterar): Promise<StatusPedidoCompra>;
  excluirPedido(codigoPedido: number): Promise<StatusPedidoCompra>;
  consultarPedido(codigoPedido: number): Promise<PedidoCompraOmie>;
  listarPedidosPagina(params: ListarPedidosCompraPageParams): Promise<ListarPedidosCompraResponse>;
}

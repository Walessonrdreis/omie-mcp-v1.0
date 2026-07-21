interface CabecalhoNotaEntradaOmie {
  nCodNotaEnt: number;
  cNumeroNotaEnt: string;
  dPrevisao: string;
  nCodCli: number;
}

interface TotaisNotaEntradaOmie {
  nMercadorias: number;
  nDescontos: number;
  nIPI: number;
  nICMSST: number;
  nTotalNotaEnt: number;
}

interface ProdutoNotaEntradaOmie {
  cCFOP: string;
  cNCM: string;
  codigo_local_estoque: number;
  [chave: string]: unknown;
}

export interface NotaEntradaResumoOmie {
  cabec: CabecalhoNotaEntradaOmie;
  totais: TotaisNotaEntradaOmie;
}

export interface NotaEntradaOmie extends NotaEntradaResumoOmie {
  produtos: ProdutoNotaEntradaOmie[];
}

export interface ListarNotaEntradaResponse {
  nPagina: number;
  nTotalPaginas: number;
  nRegistros: number;
  nTotalRegistros: number;
  notas: NotaEntradaResumoOmie[];
}

export interface ListarNotaEntradaPageParams {
  pagina: number;
  registrosPorPagina: number;
  dataAlteracaoDe?: string;
  dataAlteracaoAte?: string;
}

/**
 * Contrato de acesso a Nota de Entrada (`produtos/notaentrada`) — registro
 * fiscal de recebimento físico de mercadoria vinda de compra. SOMENTE
 * LEITURA por decisão do usuário: emissão/alteração é lançamento
 * fiscal/financeiro definitivo (etapa final do fluxo Requisição → Pedido de
 * Compra → Recebimento de NF-e → Nota de Entrada), sem round-trip seguro de
 * teste como os demais cadastros deste projeto.
 */
export interface INotaEntradaGateway {
  listarNotasPagina(params: ListarNotaEntradaPageParams): Promise<ListarNotaEntradaResponse>;
  consultarNota(codigoNota: number): Promise<NotaEntradaOmie>;
}

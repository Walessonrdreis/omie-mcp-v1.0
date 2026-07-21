export interface ContaCorrenteOmie {
  nCodCC: number;
  descricao: string;
  codigo_banco: string;
  tipo_conta_corrente: string;
  inativo: "S" | "N";
  saldo_inicial: number;
  saldo_data: string;
}

export interface MovimentoExtratoOmie {
  nCodLancamento?: number;
  cSituacao?: string;
  dDataLancamento: string;
  cDesCliente: string;
  cTipoDocumento?: string;
  cNumero?: string;
  nValorDocumento: number;
  nSaldo: number;
  nSaldoPrev: number;
  cDesCategoria?: string;
  cDocumentoFiscal?: string;
  cNatureza?: string;
  cObservacoes?: string;
}

export interface ExtratoContaCorrenteOmie {
  nCodCC: number;
  cDescricao: string;
  dPeriodoInicial: string;
  dPeriodoFinal: string;
  nSaldoAnterior: number;
  nSaldoAtual: number;
  nSaldoConciliado: number;
  nSaldoProvisorio: number;
  nSaldoDisponivel: number;
  listaMovimentos: MovimentoExtratoOmie[];
}

export interface ConsultarExtratoParams {
  codigoContaCorrente: number;
  periodoInicial: string;
  periodoFinal: string;
}

/**
 * Contrato de acesso ao cadastro de contas correntes, independente de vir da
 * Omie real ou de um fake em memória (`OMIE_MOCK=true`). Reaproveitado por
 * outros módulos que recebem só o código da conta (nCodCC) e precisam do
 * nome/descrição (ex: `fluxoCaixa`).
 */
export interface IContasCorrentesGateway {
  /** Poucas dezenas de contas em geral — busca todas as páginas e devolve um mapa código -> conta. */
  mapaContasPorCodigo(): Promise<Map<number, ContaCorrenteOmie>>;

  /** Extrato de uma conta corrente num período (movimentos + saldos). */
  consultarExtrato(params: ConsultarExtratoParams): Promise<ExtratoContaCorrenteOmie>;
}

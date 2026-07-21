export interface ContaReceberOmie {
  codigo_lancamento_omie: number;
  codigo_cliente_fornecedor: number;
  data_vencimento: string;
  valor_documento: number;
  status_titulo: string;
  numero_documento_fiscal: string;
  numero_pedido: string;
  codigo_categoria: string;
}

export interface ListarContasReceberResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  conta_receber_cadastro: ContaReceberOmie[];
}

export interface BoletoOmie {
  cLinkBoleto: string;
  cCodStatus: string;
  cDesStatus: string;
  dDtEmBol: string;
  cNumBoleto: string;
  cCodBarras: string;
  nPerJuros: number;
  nPerMulta: number;
  cNumBancario: string;
}

export interface StatusCancelamentoBoletoOmie {
  cCodStatus: string;
  cDesStatus: string;
}

/**
 * Contrato de acesso ao módulo de Contas a Receber, independente de vir da
 * Omie real ou de um fake em memória (`OMIE_MOCK=true`).
 *
 * `dataDe`/`dataAte` (testado direto na API): filtram pela **data de última
 * alteração do lançamento** (`info.dAlt`), não pela data de vencimento —
 * confirmado testando com uma faixa de 1 dia e comparando com
 * `data_vencimento` dos registros retornados (datas diferentes, `dAlt`
 * sempre dentro da faixa pedida).
 */
export interface IContasReceberGateway {
  listarPagina(
    pagina: number,
    registrosPorPagina: number,
    dataDe?: string,
    dataAte?: string
  ): Promise<ListarContasReceberResponse>;

  gerarBoleto(codigoTitulo: number): Promise<BoletoOmie>;
  obterBoleto(codigoTitulo: number): Promise<BoletoOmie>;
  prorrogarBoleto(codigoTitulo: number, novaDataVencimento: string): Promise<BoletoOmie>;
  cancelarBoleto(codigoTitulo: number): Promise<StatusCancelamentoBoletoOmie>;
}

export interface ContaPagarOmie {
  codigo_lancamento_omie: number;
  codigo_cliente_fornecedor: number;
  data_vencimento: string;
  valor_documento: number;
  status_titulo: string;
  numero_documento_fiscal: string;
  codigo_categoria: string;
  observacao: string;
}

export interface ListarContasPagarResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  conta_pagar_cadastro: ContaPagarOmie[];
}

/**
 * Contrato de acesso ao módulo de Contas a Pagar, independente de vir da
 * Omie real ou de um fake em memória (`OMIE_MOCK=true`).
 *
 * `dataDe`/`dataAte` (testado direto na API, ver contasReceber): filtram pela
 * **data de última alteração do lançamento** (`info.dAlt`), não pela data de
 * vencimento.
 */
export interface IContasPagarGateway {
  listarPagina(
    pagina: number,
    registrosPorPagina: number,
    dataDe?: string,
    dataAte?: string
  ): Promise<ListarContasPagarResponse>;
}

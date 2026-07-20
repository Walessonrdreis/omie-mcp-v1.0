import { OmieClient } from "../../../../omieClient.js";

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
 * Encapsula o acesso ao módulo de Contas a Pagar da Omie.
 *
 * `filtrar_por_data_de`/`filtrar_por_data_ate` (testado direto na API, ver contasReceber):
 * filtram pela **data de última alteração do lançamento** (`info.dAlt`), não pela data de
 * vencimento.
 */
export class ContasPagarOmieGateway {
  constructor(private readonly client: OmieClient) {}

  async listarPagina(
    pagina: number,
    registrosPorPagina: number,
    dataDe?: string,
    dataAte?: string
  ): Promise<ListarContasPagarResponse> {
    return this.client.call<ListarContasPagarResponse>({
      resource: "financas/contapagar",
      call: "ListarContasPagar",
      param: {
        pagina,
        registros_por_pagina: registrosPorPagina,
        ...(dataDe ? { filtrar_por_data_de: dataDe } : {}),
        ...(dataAte ? { filtrar_por_data_ate: dataAte } : {}),
      },
    });
  }
}
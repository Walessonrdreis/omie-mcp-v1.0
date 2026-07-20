import { OmieClient } from "../../../../omieClient.js";

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

/**
 * Encapsula o acesso ao módulo de Contas a Receber da Omie.
 *
 * `filtrar_por_data_de`/`filtrar_por_data_ate` (testado direto na API): filtram pela
 * **data de última alteração do lançamento** (`info.dAlt`), não pela data de vencimento —
 * confirmado testando com uma faixa de 1 dia e comparando com `data_vencimento` dos
 * registros retornados (datas diferentes, `dAlt` sempre dentro da faixa pedida).
 */
export class ContasReceberOmieGateway {
  constructor(private readonly client: OmieClient) {}

  async listarPagina(
    pagina: number,
    registrosPorPagina: number,
    dataDe?: string,
    dataAte?: string
  ): Promise<ListarContasReceberResponse> {
    return this.client.call<ListarContasReceberResponse>({
      resource: "financas/contareceber",
      call: "ListarContasReceber",
      param: {
        pagina,
        registros_por_pagina: registrosPorPagina,
        ...(dataDe ? { filtrar_por_data_de: dataDe } : {}),
        ...(dataAte ? { filtrar_por_data_ate: dataAte } : {}),
      },
    });
  }
}
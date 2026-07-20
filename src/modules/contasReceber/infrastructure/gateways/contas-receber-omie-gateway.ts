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
 */
export class ContasReceberOmieGateway {
  constructor(private readonly client: OmieClient) {}

  async listarPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarContasReceberResponse> {
    return this.client.call<ListarContasReceberResponse>({
      resource: "financas/contareceber",
      call: "ListarContasReceber",
      param: {
        pagina,
        registros_por_pagina: registrosPorPagina,
      },
    });
  }
}
import { OmieClient } from "../../../../omieClient.js";
import {
  IContasPagarGateway,
  ListarContasPagarResponse,
} from "../../domain/interfaces/contas-pagar-gateway.js";

export { ContaPagarOmie } from "../../domain/interfaces/contas-pagar-gateway.js";

/**
 * Encapsula o acesso ao módulo de Contas a Pagar da Omie.
 *
 * `filtrar_por_data_de`/`filtrar_por_data_ate` (testado direto na API, ver contasReceber):
 * filtram pela **data de última alteração do lançamento** (`info.dAlt`), não pela data de
 * vencimento.
 */
export class ContasPagarOmieGateway implements IContasPagarGateway {
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

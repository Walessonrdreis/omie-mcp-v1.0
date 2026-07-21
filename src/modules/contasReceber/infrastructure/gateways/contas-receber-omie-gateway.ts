import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import {
  BoletoOmie,
  IContasReceberGateway,
  ListarContasReceberResponse,
  StatusCancelamentoBoletoOmie,
} from "../../domain/interfaces/contas-receber-gateway.js";

export { ContaReceberOmie } from "../../domain/interfaces/contas-receber-gateway.js";

/**
 * Encapsula o acesso ao módulo de Contas a Receber da Omie.
 *
 * `filtrar_por_data_de`/`filtrar_por_data_ate` (testado direto na API): filtram pela
 * **data de última alteração do lançamento** (`info.dAlt`), não pela data de vencimento —
 * confirmado testando com uma faixa de 1 dia e comparando com `data_vencimento` dos
 * registros retornados (datas diferentes, `dAlt` sempre dentro da faixa pedida).
 */
export class ContasReceberOmieGateway implements IContasReceberGateway {
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

  async gerarBoleto(codigoTitulo: number): Promise<BoletoOmie> {
    return this.client.call<BoletoOmie>({
      resource: "financas/contareceberboleto",
      call: "GerarBoleto",
      param: { nCodTitulo: codigoTitulo },
    });
  }

  async obterBoleto(codigoTitulo: number): Promise<BoletoOmie> {
    return this.client.call<BoletoOmie>({
      resource: "financas/contareceberboleto",
      call: "ObterBoleto",
      param: { nCodTitulo: codigoTitulo },
    });
  }

  async prorrogarBoleto(codigoTitulo: number, novaDataVencimento: string): Promise<BoletoOmie> {
    return this.client.call<BoletoOmie>({
      resource: "financas/contareceberboleto",
      call: "ProrrogarBoleto",
      param: { nCodTitulo: codigoTitulo, dDtVenc: novaDataVencimento },
    });
  }

  async cancelarBoleto(codigoTitulo: number): Promise<StatusCancelamentoBoletoOmie> {
    return this.client.call<StatusCancelamentoBoletoOmie>({
      resource: "financas/contareceberboleto",
      call: "CancelarBoleto",
      param: { nCodTitulo: codigoTitulo },
    });
  }
}

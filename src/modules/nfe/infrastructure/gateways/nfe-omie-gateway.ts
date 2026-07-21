import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import {
  INfeGateway,
  ListarNFPageParams,
  ListarNFResponse,
  NotaFiscalOmie,
} from "../../domain/interfaces/nfe-gateway.js";

/**
 * Encapsula o acesso à consulta de notas fiscais da Omie. Recurso
 * 'produtos/nfconsultar' — só leitura (`ListarNF`/`ConsultarNF`); não existe
 * aqui inclusão/emissão de NF-e (ver docs/CONTEXTO-SESSOES.md pro motivo).
 */
export class NfeOmieGateway implements INfeGateway {
  constructor(private readonly client: OmieClient) {}

  async listarNotasPagina(params: ListarNFPageParams): Promise<ListarNFResponse> {
    return this.client.call<ListarNFResponse>({
      resource: "produtos/nfconsultar",
      call: "ListarNF",
      param: {
        pagina: params.pagina,
        registros_por_pagina: params.registrosPorPagina,
        filtrar_por_data_de: params.filtrarPorDataDe,
        filtrar_por_data_ate: params.filtrarPorDataAte,
        filtrar_por_status: params.filtrarPorStatus,
        tpNF: params.tpNF,
      },
    });
  }

  async consultarNotaPorChave(chave: string): Promise<NotaFiscalOmie> {
    return this.client.call<NotaFiscalOmie>({
      resource: "produtos/nfconsultar",
      call: "ConsultarNF",
      param: { cChaveNFe: chave },
    });
  }

  async consultarNotaPorCodigo(nCodNF: number): Promise<NotaFiscalOmie> {
    return this.client.call<NotaFiscalOmie>({
      resource: "produtos/nfconsultar",
      call: "ConsultarNF",
      param: { nCodNF },
    });
  }
}

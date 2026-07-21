import {
  INfseGateway,
  ListarLC116Response,
  ListarNFSePageParams,
  ListarNFSeResponse,
} from "../../domain/interfaces/nfse-gateway.js";

export class NfseFakeGateway implements INfseGateway {
  async listarNFSePagina(params: ListarNFSePageParams): Promise<ListarNFSeResponse> {
    return {
      nPagina: params.pagina,
      nTotPaginas: 1,
      nRegistros: 1,
      nTotRegistros: 1,
      nfseEncontradas: [
        {
          nNumeroNFSe: "1",
          cSerieNFSe: "1",
          dDtEmissao: "10/07/2026",
          nCodigoCliente: 9001,
          nValorServicos: 100,
          cStatusNFSe: "N",
        },
      ],
    };
  }

  async listarCodigosLC116Pagina(pagina: number): Promise<ListarLC116Response> {
    return {
      total_de_paginas: 1,
      total_de_registros: 1,
      cadastros: [{ cCodigo: "1.01", cDescricao: "Análise e Desenvolvimento de Sistemas (fake)", cDescrCompleta: "Análise e desenvolvimento de sistemas (fake)" }],
    };
  }
}

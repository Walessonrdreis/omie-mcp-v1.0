export interface NFSeOmie {
  nNumeroNFSe: string;
  cSerieNFSe: string;
  dDtEmissao: string;
  nCodigoCliente: number;
  nValorServicos: number;
  cStatusNFSe: string;
}

export interface ListarNFSeResponse {
  nPagina: number;
  nTotPaginas: number;
  nRegistros: number;
  nTotRegistros: number;
  nfseEncontradas: NFSeOmie[];
}

export interface ListarNFSePageParams {
  pagina: number;
  registrosPorPagina: number;
  emissaoDe?: string;
  emissaoAte?: string;
}

export interface CodigoLC116Omie {
  cCodigo: string;
  cDescricao: string;
  cDescrCompleta: string;
}

export interface ListarLC116Response {
  total_de_paginas: number;
  total_de_registros: number;
  cadastros: CodigoLC116Omie[];
}

/** Contrato de acesso a NFS-e emitidas (`servicos/nfse`) e à tabela de códigos LC116 (`servicos/lc116`), ambos só leitura. */
export interface INfseGateway {
  listarNFSePagina(params: ListarNFSePageParams): Promise<ListarNFSeResponse>;
  listarCodigosLC116Pagina(pagina: number, registrosPorPagina: number): Promise<ListarLC116Response>;
}

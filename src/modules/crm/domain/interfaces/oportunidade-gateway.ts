export interface OportunidadeParaIncluir {
  codIntOportunidade: string;
  descricao: string;
  codigoConta: number;
  codigoContato: number;
  codigoSolucao: number;
  codigoOrigem: number;
}

export interface OportunidadeParaAlterar {
  codigoOportunidade: number;
  descricao?: string;
}

export interface StatusOportunidade {
  codigoOportunidade: number;
  codIntOportunidade: string;
  codigoStatus: string;
  descricaoStatus: string;
}

export interface OportunidadeOmie {
  identificacao: {
    nCodOp: number;
    cCodIntOp: string;
    cDesOp: string;
    cNumOp: string;
    nCodConta: number;
    nCodContato: number;
    nCodSolucao: number;
    nCodOrigem: number;
  };
  fasesStatus: { nCodFase: number; nCodStatus: number };
  ticket: { nTicket: number };
}

export interface ListarOportunidadesResponse {
  pagina: number | string;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  cadastros: OportunidadeOmie[];
}

export interface ListarOportunidadesPageParams {
  pagina: number;
  registrosPorPagina: number;
}

/**
 * Contrato de acesso a Oportunidades do CRM (`crm/oportunidades`). Testado
 * ao vivo: além de conta e contato, `IncluirOportunidade` exige
 * `nCodSolucao` (ver `omie_crm_solucoes_listar`) e `nCodOrigem` (ver
 * `omie_crm_origens_listar`) — cadastros auxiliares que precisam existir
 * antes (a Omie já vem com alguns padrão, "Solução 01"/"Solução 02" etc.).
 */
export interface IOportunidadeGateway {
  incluirOportunidade(dados: OportunidadeParaIncluir): Promise<StatusOportunidade>;
  alterarOportunidade(dados: OportunidadeParaAlterar): Promise<StatusOportunidade>;
  excluirOportunidade(codigoOportunidade: number): Promise<StatusOportunidade>;
  consultarOportunidade(codigoOportunidade: number): Promise<OportunidadeOmie>;
  listarOportunidadesPagina(
    params: ListarOportunidadesPageParams
  ): Promise<ListarOportunidadesResponse>;
}

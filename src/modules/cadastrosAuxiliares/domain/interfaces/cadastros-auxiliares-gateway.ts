export interface BancoOmie {
  codigo: string;
  nome: string;
  tipo: string;
}

export interface ListarBancosResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  fin_banco_cadastro: BancoOmie[];
}

export interface ListarBancosParams {
  pagina: number;
  registrosPorPagina: number;
  nome?: string;
}

export interface CidadeOmie {
  cCod: string;
  cNome: string;
  cUF: string;
  nCodIBGE: string;
}

export interface ListarCidadesResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  lista_cidades: CidadeOmie[];
}

export interface ListarCidadesParams {
  pagina: number;
  registrosPorPagina: number;
  uf?: string;
  contendo?: string;
}

export interface PaisOmie {
  cCodigo: string;
  cCodigoISO: string;
  cDescricao: string;
}

export interface ListarPaisesResponse {
  lista_paises: PaisOmie[];
}

export interface ListarPaisesParams {
  codigoIso?: string;
  descricao?: string;
}

export interface NCMOmie {
  cCodigo: string;
  cDescricao: string;
}

export interface ListarNCMResponse {
  nPagina: number;
  nTotPaginas: number;
  nRegistros: number;
  nTotRegistros: number;
  listaNCM: NCMOmie[];
}

export interface ListarNCMParams {
  pagina: number;
  registrosPorPagina: number;
  codigo?: string;
  descricao?: string;
}

export interface UnidadeOmie {
  codigo: string;
  descricao: string;
}

/**
 * Contrato de acesso aos cadastros auxiliares/estáticos da Omie (bancos,
 * cidades, países, NCM, unidades de medida) — todos só leitura, mantidos
 * pela própria Omie (tabelas oficiais: Bacen, IBGE, Receita Federal).
 */
export interface ICadastrosAuxiliaresGateway {
  listarBancos(params: ListarBancosParams): Promise<ListarBancosResponse>;
  listarCidades(params: ListarCidadesParams): Promise<ListarCidadesResponse>;
  listarPaises(params: ListarPaisesParams): Promise<ListarPaisesResponse>;
  listarNCM(params: ListarNCMParams): Promise<ListarNCMResponse>;
  consultarUnidade(codigo: string): Promise<UnidadeOmie>;
}

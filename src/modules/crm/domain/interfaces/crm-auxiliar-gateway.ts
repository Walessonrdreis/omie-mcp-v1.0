export interface FaseOmie {
  cDescrPadrao: string;
  cDescrUsuario: string;
  cObservacao: string;
}

export interface SolucaoOmie {
  nCodigo: number;
  cDescricao: string;
  cInativo: "S" | "N";
}

export interface OrigemOmie {
  nCodigo: number;
  cDescricao: string;
  cObservacao: string;
}

/** Cadastros auxiliares do CRM, todos só leitura: Fases (funil), Soluções e Origens. */
export interface ICrmAuxiliarGateway {
  listarFases(pagina: number, registrosPorPagina: number): Promise<{ total_de_paginas: number; total_de_registros: number; cadastros: FaseOmie[] }>;
  listarSolucoes(pagina: number, registrosPorPagina: number): Promise<{ total_de_paginas: number; total_de_registros: number; cadastros: SolucaoOmie[] }>;
  listarOrigens(pagina: number, registrosPorPagina: number): Promise<{ total_de_paginas: number; total_de_registros: number; cadastros: OrigemOmie[] }>;
}

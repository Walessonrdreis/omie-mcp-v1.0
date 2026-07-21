export interface DepartamentoParaIncluir {
  codigoPai: string;
  descricao: string;
}

export interface DepartamentoParaAlterar {
  codigo: string;
  descricao?: string;
}

export interface StatusDepartamento {
  codigo: string;
  descricao: string;
  codigoStatus: string;
  descricaoStatus: string;
}

export interface DepartamentoOmie {
  codigo: string;
  descricao: string;
  estrutura: string;
  inativo: "S" | "N";
}

export interface ListarDepartamentosResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  departamentos: DepartamentoOmie[];
}

export interface ListarDepartamentosPageParams {
  pagina: number;
  registrosPorPagina: number;
}

/**
 * Contrato de acesso a Departamentos/Centro de Custo (`geral/departamentos`).
 * Testado ao vivo, achado que corrige a doc pública: o campo `codigo` de
 * `IncluirDepartamento` é o código do departamento PAI (onde o novo será
 * incluído), não do novo departamento — a Omie gera e devolve o código do
 * filho na resposta. Diferente de Categoria, aqui `ExcluirDepartamento`
 * funciona de verdade (testado round-trip completo, sem deixar rastro).
 */
export interface IDepartamentoGateway {
  incluirDepartamento(dados: DepartamentoParaIncluir): Promise<StatusDepartamento>;
  alterarDepartamento(dados: DepartamentoParaAlterar): Promise<StatusDepartamento>;
  excluirDepartamento(codigo: string): Promise<StatusDepartamento>;
  consultarDepartamento(codigo: string): Promise<DepartamentoOmie>;
  listarDepartamentosPagina(
    params: ListarDepartamentosPageParams
  ): Promise<ListarDepartamentosResponse>;
}

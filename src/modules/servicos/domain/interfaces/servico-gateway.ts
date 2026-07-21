export interface ServicoParaIncluir {
  codIntServico: string;
  descricao: string;
  codigo: string;
  precoUnitario: number;
  descricaoCompleta?: string;
  codigoCategoria?: string;
}

export interface ServicoParaAlterar {
  codigoServico: number;
  descricao?: string;
  precoUnitario?: number;
  descricaoCompleta?: string;
}

export interface StatusServico {
  codigoServico: number;
  codIntServico: string;
  codigoStatus: string;
  descricaoStatus: string;
}

interface CabecalhoServicoOmie {
  cCodigo: string;
  cDescricao: string;
  nPrecoUnit: number;
  cCodCateg: string;
}

export interface ServicoOmie {
  intListar: { cCodIntServ: string; nCodServ: number };
  cabecalho: CabecalhoServicoOmie;
  descricao: { cDescrCompleta: string };
  info: { inativo: "S" | "N" };
}

export interface ListarServicosResponse {
  nPagina: number;
  nTotPaginas: number;
  nRegistros: number;
  nTotRegistros: number;
  cadastros: ServicoOmie[];
}

export interface ListarServicosPageParams {
  pagina: number;
  registrosPorPagina: number;
}

/**
 * Contrato de acesso ao cadastro de Serviços da Omie (`servicos/servico`).
 * Testado ao vivo: `AlterarCadastroServico` exige o identificador aninhado em
 * `intEditar` (não em `cabecalho` como pareceria natural) — a doc pública não
 * deixa isso claro.
 */
export interface IServicoGateway {
  incluirServico(dados: ServicoParaIncluir): Promise<StatusServico>;
  alterarServico(dados: ServicoParaAlterar): Promise<StatusServico>;
  excluirServico(codigoServico: number): Promise<StatusServico>;
  consultarServico(codigoServico: number): Promise<ServicoOmie>;
  listarServicosPagina(params: ListarServicosPageParams): Promise<ListarServicosResponse>;
}

export interface ConteudoPermitido {
  cConteudo: string;
  nIdConteudo?: number;
}

export interface CaracteristicaParaIncluir {
  codIntCaracteristica: string;
  nome: string;
  valorDefinido: "S" | "N";
  conteudosPermitidos?: string[];
}

export interface CaracteristicaParaAlterar {
  codigoCaracteristica: number;
  nome?: string;
}

export interface StatusCaracteristica {
  codigoCaracteristica: number;
  codIntCaracteristica: string;
  codigoStatus: string;
  descricaoStatus: string;
}

export interface CaracteristicaOmie {
  nCodCaract: number;
  cCodIntCaract: string;
  cNomeCaract: string;
  conteudosPermitidos: ConteudoPermitido[];
}

export interface ListarCaracteristicasResponse {
  nPagina: number;
  nTotPaginas: number;
  nRegistros: number;
  nTotRegistros: number;
  listaCaracteristicas: CaracteristicaOmie[];
}

export interface ListarCaracteristicasPageParams {
  pagina: number;
  registrosPorPagina: number;
}

/**
 * Contrato de acesso ao cadastro de Características de Produto
 * (`geral/caracteristicas`) — atributos reutilizáveis (ex: "Cor", "Tamanho")
 * que podem ser associados a produtos. Testado ao vivo: CRUD completo
 * funciona sem ressalvas, diferente de Categoria.
 */
export interface ICaracteristicaGateway {
  incluirCaracteristica(dados: CaracteristicaParaIncluir): Promise<StatusCaracteristica>;
  alterarCaracteristica(dados: CaracteristicaParaAlterar): Promise<StatusCaracteristica>;
  excluirCaracteristica(codigoCaracteristica: number): Promise<StatusCaracteristica>;
  consultarCaracteristica(codigoCaracteristica: number): Promise<CaracteristicaOmie>;
  listarCaracteristicasPagina(
    params: ListarCaracteristicasPageParams
  ): Promise<ListarCaracteristicasResponse>;
}

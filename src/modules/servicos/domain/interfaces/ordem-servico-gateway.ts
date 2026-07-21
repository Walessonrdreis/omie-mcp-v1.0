export interface ItemOrdemServico {
  quantidade: number;
  valorUnitario: number;
  descricao: string;
  tributacaoServico: string;
  codigoServicoMunicipal: string;
  codigoServicoLC116: string;
  retemISS: "S" | "N";
}

export interface OrdemServicoParaIncluir {
  codIntOS: string;
  codigoCliente: number;
  codigoCondicaoPagamento: string;
  dataPrevisao: string;
  etapa: string;
  quantidadeParcelas: number;
  codigoCategoria: string;
  codigoContaCorrente: number;
  itens: ItemOrdemServico[];
}

export interface OrdemServicoParaAlterar {
  codigoOS: number;
  dataPrevisao?: string;
  etapa?: string;
}

export interface StatusOrdemServico {
  codigoOS: number;
  codIntOS: string;
  numero: string;
  codigoStatus: string;
  descricaoStatus: string;
}

interface CabecalhoOSOmie {
  nCodOS: number;
  cCodIntOS: string;
  cNumOS: string;
  nCodCli: number;
  cEtapa: string;
  dDtPrevisao: string;
  nValorTotal: number;
}

interface ItemOSOmie {
  cDescServ: string;
  nQtde: number;
  nValUnit: number;
}

interface InfoCadastroOSOmie {
  cFaturada: "S" | "N";
  cCancelada: "S" | "N";
}

export interface OrdemServicoOmie {
  Cabecalho: CabecalhoOSOmie;
  ServicosPrestados: ItemOSOmie[];
  InfoCadastro: InfoCadastroOSOmie;
}

export interface ListarOSResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  osCadastro: OrdemServicoOmie[];
}

export interface ListarOSPageParams {
  pagina: number;
  registrosPorPagina: number;
}

/**
 * Contrato de acesso a Ordem de Serviço da Omie (`servicos/os`). Testado ao
 * vivo, achados que corrigem a doc pública: (1) `cCodServMun`/`cCodServLC116`
 * precisam ser um código válido de `servicos/lc116` (`ListarLC116`), não
 * texto livre — a doc pública não deixa claro que é obrigatório usar um
 * código já cadastrado; (2) `cRetemISS` é obrigatório em cada item mesmo não
 * estando marcado como tal na doc pública.
 */
export interface IOrdemServicoGateway {
  incluirOS(dados: OrdemServicoParaIncluir): Promise<StatusOrdemServico>;
  alterarOS(dados: OrdemServicoParaAlterar): Promise<StatusOrdemServico>;
  excluirOS(codigoOS: number): Promise<StatusOrdemServico>;
  consultarOS(codigoOS: number): Promise<OrdemServicoOmie>;
  listarOSPagina(params: ListarOSPageParams): Promise<ListarOSResponse>;
}

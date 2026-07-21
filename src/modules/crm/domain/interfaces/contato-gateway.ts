export interface ContatoParaIncluir {
  codIntContato: string;
  nome: string;
  sobrenome: string;
  codigoConta: number;
  email?: string;
}

export interface ContatoParaAlterar {
  codigoContato: number;
  nome?: string;
  sobrenome?: string;
  email?: string;
}

export interface StatusContato {
  codigoContato: number;
  codIntContato: string;
  codigoStatus: string;
  descricaoStatus: string;
}

export interface ContatoOmie {
  identificacao: {
    nCod: number;
    cCodInt: string;
    cNome: string;
    cSobrenome: string;
    nCodConta: number;
  };
  telefone_email: { cEmail: string };
}

export interface ListarContatosResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  cadastros: ContatoOmie[];
}

export interface ListarContatosPageParams {
  pagina: number;
  registrosPorPagina: number;
}

/** Contrato de acesso a Contatos do CRM (`crm/contatos`), vinculados a uma Conta. */
export interface IContatoGateway {
  incluirContato(dados: ContatoParaIncluir): Promise<StatusContato>;
  alterarContato(dados: ContatoParaAlterar): Promise<StatusContato>;
  excluirContato(codigoContato: number): Promise<StatusContato>;
  consultarContato(codigoContato: number): Promise<ContatoOmie>;
  listarContatosPagina(params: ListarContatosPageParams): Promise<ListarContatosResponse>;
}

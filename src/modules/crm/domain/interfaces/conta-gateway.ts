export interface ContaParaIncluir {
  codIntConta: string;
  nome: string;
  uf: string;
  cidade: string;
  email: string;
}

export interface ContaParaAlterar {
  codigoConta: number;
  nome?: string;
  uf?: string;
  cidade?: string;
  email?: string;
}

export interface StatusConta {
  codigoConta: number;
  codIntConta: string;
  codigoStatus: string;
  descricaoStatus: string;
}

export interface ContaOmie {
  identificacao: {
    nCod: number;
    cCodInt: string;
    cNome: string;
    cNomeFantasia: string;
    cDoc: string;
  };
  endereco: { cUF: string; cCidade: string };
  telefone_email: { cEmail: string };
}

export interface ListarContasResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  cadastros: ContaOmie[];
}

export interface ListarContasPageParams {
  pagina: number;
  registrosPorPagina: number;
}

/**
 * Contrato de acesso a Contas do CRM (`crm/contas`). Testado ao vivo:
 * `IncluirConta`/`AlterarConta` exigem os blocos `endereco` e
 * `telefone_email` presentes (mesmo com poucos campos preenchidos) — a Omie
 * recusa com "Tag [endereco]/[telefone_email] não informada!" se o bloco
 * inteiro faltar, mesmo que cada campo individual seja opcional.
 */
export interface IContaGateway {
  incluirConta(dados: ContaParaIncluir): Promise<StatusConta>;
  alterarConta(dados: ContaParaAlterar): Promise<StatusConta>;
  excluirConta(codigoConta: number): Promise<StatusConta>;
  consultarConta(codigoConta: number): Promise<ContaOmie>;
  listarContasPagina(params: ListarContasPageParams): Promise<ListarContasResponse>;
}

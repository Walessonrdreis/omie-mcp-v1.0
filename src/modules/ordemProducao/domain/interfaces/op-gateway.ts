export interface OrdemProducao {
  identificacao: {
    cCodIntOP: string;
    cNumOP: string;
    codigo_local_estoque: number;
    dDtPrevisao: string;
    nCodOP: number;
    nCodProduto: number;
    nQtde: number;
  };
  infAdicionais: {
    /**
     * Código cru da etapa no kanban de produção. NÃO tem significado fixo:
     * cada conta Omie configura de 3 a 6 etapas com nomes próprios, e a API
     * não expõe endpoint pra traduzir o código pro nome — por isso este
     * gateway não tenta interpretar esse valor, só repassa.
     */
    cEtapa: string;
    dDtConclusao: string;
    dDtInicio: string;
    nCodProjeto: number;
  };
  outrasInf: {
    cConcluida: "S" | "N";
    dConclusao: string;
    dInclusao: string;
  };
}

export interface ListarOrdemProducaoResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  cadastros: OrdemProducao[];
}

/**
 * Dados pra gravar uma OP (Incluir/Alterar). Testado ao vivo: `codigo_local_estoque`
 * é obrigatório mesmo na inclusão simples (0 = local padrão), e o produto
 * precisa já ter estrutura (BOM) preenchida, senão a Omie recusa.
 */
export interface DadosOPParaGravar {
  nCodOP?: number;
  cCodIntOP?: string;
  nCodProduto: number;
  dDtPrevisao: string;
  nQtde: number;
  codigo_local_estoque: number;
}

export interface StatusOPOmie {
  nCodOP: number;
  cCodIntOP: string;
  cCodStatus: string;
  cDesStatus: string;
}

/** Identifica uma OP — nCodOP ou cCodIntOP já bastam. */
export interface ChaveOP {
  nCodOP?: number;
  cCodIntOP?: string;
}

export interface OrdemProducaoDetalhada extends OrdemProducao {
  observacoes?: { cObs: string };
  itensDetalhes?: Array<{
    nIdProdutoMalha: number;
    nQtde: number;
    codigo_local_estoque: number;
    cObs: string;
  }>;
}

/**
 * Contrato de acesso a Ordens de Produção, independente de vir da Omie real
 * ou de um fake em memória (`OMIE_MOCK=true`).
 */
export interface IOrdemProducaoGateway {
  listarOrdensPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarOrdemProducaoResponse>;

  consultarOP(chave: ChaveOP): Promise<OrdemProducaoDetalhada>;

  incluirOP(dados: DadosOPParaGravar): Promise<StatusOPOmie>;

  alterarOP(dados: DadosOPParaGravar): Promise<StatusOPOmie>;

  excluirOP(chave: ChaveOP): Promise<StatusOPOmie>;
}

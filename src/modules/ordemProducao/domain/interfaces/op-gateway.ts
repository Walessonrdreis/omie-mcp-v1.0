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
 * Contrato de acesso a Ordens de Produção, independente de vir da Omie real
 * ou de um fake em memória (`OMIE_MOCK=true`).
 */
export interface IOrdemProducaoGateway {
  listarOrdensPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarOrdemProducaoResponse>;
}

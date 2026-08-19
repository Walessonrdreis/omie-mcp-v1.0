/** Ordem de Produção crua, como a API Omie devolve em ListarOrdemProducao. */
export interface OrdemProducaoOmieBruta {
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
     * não expõe endpoint pra traduzir o código pro nome — por isso o dado
     * bruto não interpreta esse valor, só guarda.
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

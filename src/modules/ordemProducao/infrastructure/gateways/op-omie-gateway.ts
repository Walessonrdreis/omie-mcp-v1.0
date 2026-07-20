import { OmieClient } from "../../../../omieClient.js";

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

interface ListarOrdemProducaoResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  cadastros: OrdemProducao[];
}

export class OpOmieGateway {
  constructor(private readonly client: OmieClient) {}

  async listarOrdensPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarOrdemProducaoResponse> {
    return this.client.call<ListarOrdemProducaoResponse>({
      resource: "produtos/op",
      call: "ListarOrdemProducao",
      param: { pagina, registros_por_pagina: registrosPorPagina },
    });
  }
}

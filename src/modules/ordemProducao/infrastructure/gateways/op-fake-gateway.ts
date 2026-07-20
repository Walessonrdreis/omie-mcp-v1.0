import {
  IOrdemProducaoGateway,
  ListarOrdemProducaoResponse,
  OrdemProducao,
} from "../../domain/interfaces/op-gateway.js";

const ORDENS_FAKE: OrdemProducao[] = [
  {
    identificacao: {
      cCodIntOP: "OP-FAKE-001",
      cNumOP: "1",
      codigo_local_estoque: 1,
      dDtPrevisao: "31/12/2026",
      nCodOP: 1001,
      nCodProduto: 111,
      nQtde: 10,
    },
    infAdicionais: {
      cEtapa: "10",
      dDtConclusao: "",
      dDtInicio: "01/12/2026",
      nCodProjeto: 0,
    },
    outrasInf: {
      cConcluida: "N",
      dConclusao: "",
      dInclusao: "01/12/2026",
    },
  },
  {
    identificacao: {
      cCodIntOP: "OP-FAKE-002",
      cNumOP: "2",
      codigo_local_estoque: 1,
      dDtPrevisao: "15/12/2026",
      nCodOP: 1002,
      nCodProduto: 222,
      nQtde: 5,
    },
    infAdicionais: {
      cEtapa: "30",
      dDtConclusao: "10/12/2026",
      dDtInicio: "05/12/2026",
      nCodProjeto: 0,
    },
    outrasInf: {
      cConcluida: "S",
      dConclusao: "10/12/2026",
      dInclusao: "05/12/2026",
    },
  },
];

/**
 * Implementação em memória de `IOrdemProducaoGateway`, sem chamar a Omie real
 * — usada quando `OMIE_MOCK=true`, pra desenvolvimento/testes offline.
 */
export class OpFakeGateway implements IOrdemProducaoGateway {
  constructor(private readonly ordens: OrdemProducao[] = ORDENS_FAKE) {}

  async listarOrdensPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarOrdemProducaoResponse> {
    const inicio = (pagina - 1) * registrosPorPagina;
    const pagina_de_ordens = this.ordens.slice(inicio, inicio + registrosPorPagina);
    const totalPaginas = Math.max(1, Math.ceil(this.ordens.length / registrosPorPagina));

    return {
      pagina,
      total_de_paginas: totalPaginas,
      registros: pagina_de_ordens.length,
      total_de_registros: this.ordens.length,
      cadastros: pagina_de_ordens,
    };
  }
}

import {
  ChaveOP,
  DadosOPParaGravar,
  IOrdemProducaoGateway,
  ListarOrdemProducaoResponse,
  OrdemProducao,
  OrdemProducaoDetalhada,
  StatusOPOmie,
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
  private proximoCodigo = 2000;

  /**
   * Cópia própria por instância (não a constante `ORDENS_FAKE` direto) —
   * mesmo cuidado de `ProdutosFakeGateway`/`EstruturaFakeGateway`: agora que
   * o fake também cria/altera/exclui, compartilhar o array por referência
   * vazaria estado de um teste pro outro.
   */
  constructor(
    private readonly ordens: OrdemProducao[] = ORDENS_FAKE.map((o) => ({
      identificacao: { ...o.identificacao },
      infAdicionais: { ...o.infAdicionais },
      outrasInf: { ...o.outrasInf },
    }))
  ) {}

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

  private encontrar(chave: ChaveOP): OrdemProducao | undefined {
    return this.ordens.find(
      (o) =>
        (chave.nCodOP !== undefined && o.identificacao.nCodOP === chave.nCodOP) ||
        (chave.cCodIntOP !== undefined && o.identificacao.cCodIntOP === chave.cCodIntOP)
    );
  }

  async consultarOP(chave: ChaveOP): Promise<OrdemProducaoDetalhada> {
    const ordem = this.encontrar(chave);
    if (!ordem) {
      throw new Error(`OP não encontrada (fake): ${JSON.stringify(chave)}`);
    }
    return { ...ordem, observacoes: { cObs: "" }, itensDetalhes: [] };
  }

  async incluirOP(dados: DadosOPParaGravar): Promise<StatusOPOmie> {
    const nCodOP = this.proximoCodigo++;
    this.ordens.push({
      identificacao: {
        cCodIntOP: dados.cCodIntOP ?? "",
        cNumOP: String(nCodOP),
        codigo_local_estoque: dados.codigo_local_estoque,
        dDtPrevisao: dados.dDtPrevisao,
        nCodOP,
        nCodProduto: dados.nCodProduto,
        nQtde: dados.nQtde,
      },
      infAdicionais: { cEtapa: "10", dDtConclusao: "", dDtInicio: "", nCodProjeto: 0 },
      outrasInf: { cConcluida: "N", dConclusao: "", dInclusao: "" },
    });

    return {
      nCodOP,
      cCodIntOP: dados.cCodIntOP ?? "",
      cCodStatus: "0",
      cDesStatus: "Ordem de Produção cadastrada com sucesso! (fake)",
    };
  }

  async alterarOP(dados: DadosOPParaGravar): Promise<StatusOPOmie> {
    const ordem = this.encontrar({ nCodOP: dados.nCodOP, cCodIntOP: dados.cCodIntOP });
    if (!ordem) {
      throw new Error(`OP não encontrada pra alterar (fake): ${JSON.stringify(dados)}`);
    }

    ordem.identificacao.nCodProduto = dados.nCodProduto;
    ordem.identificacao.dDtPrevisao = dados.dDtPrevisao;
    ordem.identificacao.nQtde = dados.nQtde;
    ordem.identificacao.codigo_local_estoque = dados.codigo_local_estoque;

    return {
      nCodOP: ordem.identificacao.nCodOP,
      cCodIntOP: ordem.identificacao.cCodIntOP,
      cCodStatus: "0",
      cDesStatus: "Ordem de Produção alterada com sucesso! (fake)",
    };
  }

  async excluirOP(chave: ChaveOP): Promise<StatusOPOmie> {
    const indice = this.ordens.findIndex(
      (o) =>
        (chave.nCodOP !== undefined && o.identificacao.nCodOP === chave.nCodOP) ||
        (chave.cCodIntOP !== undefined && o.identificacao.cCodIntOP === chave.cCodIntOP)
    );
    if (indice === -1) {
      throw new Error(`OP não encontrada pra excluir (fake): ${JSON.stringify(chave)}`);
    }

    const [ordem] = this.ordens.splice(indice, 1);

    return {
      nCodOP: ordem.identificacao.nCodOP,
      cCodIntOP: ordem.identificacao.cCodIntOP,
      cCodStatus: "1",
      cDesStatus: "Ordem de Produção excluída com sucesso! (fake)",
    };
  }
}

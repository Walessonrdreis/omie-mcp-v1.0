import {
  AlterarIncluirEstruturaResponse,
  EstruturaProdutoOmie,
  ExcluirEstruturaStatus,
  IEstruturaGateway,
  ItemEstruturaParaAlterar,
  ItemEstruturaParaIncluir,
  ListarEstruturasResponse,
} from "../../domain/interfaces/estrutura-gateway.js";

const ESTRUTURAS_FAKE: EstruturaProdutoOmie[] = [
  {
    ident: {
      idProduto: 111,
      intProduto: "",
      codProduto: "PROD-001",
      descrProduto: "Ração 100kg",
      tipoProduto: "P",
      idFamilia: 1,
      codFamilia: "FAM01",
      descrFamilia: "Família Fake",
      unidProduto: "UN",
      pesoLiqProduto: 100,
      pesoBrutoProduto: 102,
    },
    itens: [
      {
        idMalha: 1,
        intMalha: "",
        idProdMalha: 501,
        intProdMalha: "",
        codProdMalha: "INS-001",
        descrProdMalha: "Milho",
        quantProdMalha: 60,
        unidProdMalha: "KG",
        tipoProdMalha: "M",
        idFamMalha: 2,
        codFamMalha: "FAM02",
        descrFamMalha: "Insumos",
        pesoLiqProdMalha: 60,
        pesoBrutoProdMalha: 60,
        percPerdaProdMalha: 0,
        obsProdMalha: "",
      },
      {
        idMalha: 2,
        intMalha: "",
        idProdMalha: 502,
        intProdMalha: "",
        codProdMalha: "INS-002",
        descrProdMalha: "Farelo de Soja",
        quantProdMalha: 40,
        unidProdMalha: "KG",
        tipoProdMalha: "M",
        idFamMalha: 2,
        codFamMalha: "FAM02",
        descrFamMalha: "Insumos",
        pesoLiqProdMalha: 40,
        pesoBrutoProdMalha: 40,
        percPerdaProdMalha: 0,
        obsProdMalha: "",
      },
    ],
  },
  {
    ident: {
      idProduto: 222,
      intProduto: "",
      codProduto: "PROD-002",
      descrProduto: "Produto Fake 2",
      tipoProduto: "P",
      idFamilia: 1,
      codFamilia: "FAM01",
      descrFamilia: "Família Fake",
      unidProduto: "UN",
      pesoLiqProduto: 0,
      pesoBrutoProduto: 0,
    },
    itens: [],
  },
];

/**
 * Implementação em memória de `IEstruturaGateway`, sem chamar a Omie real —
 * usada quando `OMIE_MOCK=true`, pra desenvolvimento/testes offline.
 */
export class EstruturaFakeGateway implements IEstruturaGateway {
  private proximoIdMalha = 5000;

  /**
   * Cópia própria por instância (não a constante `ESTRUTURAS_FAKE` direto) —
   * agora que o fake também inclui/altera/exclui item de estrutura,
   * compartilhar o array por referência entre instâncias vazaria estado de
   * um teste pro outro (mesmo bug corrigido em `ProdutosFakeGateway`).
   */
  constructor(
    private readonly estruturas: EstruturaProdutoOmie[] = ESTRUTURAS_FAKE.map((e) => ({
      ...e,
      itens: e.itens.map((item) => ({ ...item })),
    }))
  ) {}

  async listarEstruturasPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarEstruturasResponse> {
    const inicio = (pagina - 1) * registrosPorPagina;
    const paginaDeEstruturas = this.estruturas.slice(inicio, inicio + registrosPorPagina);
    const totalPaginas = Math.max(1, Math.ceil(this.estruturas.length / registrosPorPagina));

    return {
      nPagina: pagina,
      nTotPaginas: totalPaginas,
      nRegistros: paginaDeEstruturas.length,
      nTotRegistros: this.estruturas.length,
      produtosEncontrados: paginaDeEstruturas,
    };
  }

  private encontrarProduto(idProduto: number): EstruturaProdutoOmie {
    const produto = this.estruturas.find((e) => e.ident.idProduto === idProduto);
    if (!produto) {
      throw new Error(`Produto ${idProduto} não encontrado na estrutura (fake).`);
    }
    return produto;
  }

  async incluirItensEstrutura(
    idProduto: number,
    itens: ItemEstruturaParaIncluir[]
  ): Promise<AlterarIncluirEstruturaResponse> {
    const produto = this.encontrarProduto(idProduto);

    const itemMalhaStatus = itens.map((item) => {
      const idMalha = this.proximoIdMalha++;
      produto.itens.push({
        idMalha,
        intMalha: item.intMalha,
        idProdMalha: item.idProdMalha,
        intProdMalha: "",
        codProdMalha: "",
        descrProdMalha: "",
        quantProdMalha: item.quantProdMalha,
        unidProdMalha: "",
        tipoProdMalha: "",
        idFamMalha: 0,
        codFamMalha: "",
        descrFamMalha: "",
        pesoLiqProdMalha: 0,
        pesoBrutoProdMalha: 0,
        percPerdaProdMalha: item.percPerdaProdMalha ?? 0,
        obsProdMalha: item.obsProdMalha ?? "",
      });
      return {
        codStatus: "ADD",
        descrStatus: "Item adicionado com sucesso! (fake)",
        idMalha,
        idProdMalha: item.idProdMalha,
        intMalha: item.intMalha,
        intProdMalha: "",
      };
    });

    return { itemMalhaStatus };
  }

  async alterarItensEstrutura(
    idProduto: number,
    itens: ItemEstruturaParaAlterar[]
  ): Promise<AlterarIncluirEstruturaResponse> {
    const produto = this.encontrarProduto(idProduto);

    const itemMalhaStatus = itens.map((item) => {
      const existente = produto.itens.find((i) => i.idMalha === item.idMalha);
      if (!existente) {
        throw new Error(`Item de estrutura ${item.idMalha} não encontrado (fake).`);
      }
      if (item.quantProdMalha !== undefined) existente.quantProdMalha = item.quantProdMalha;
      if (item.percPerdaProdMalha !== undefined) existente.percPerdaProdMalha = item.percPerdaProdMalha;
      if (item.obsProdMalha !== undefined) existente.obsProdMalha = item.obsProdMalha;

      return {
        codStatus: "UPD",
        descrStatus: "Item alterado com sucesso! (fake)",
        idMalha: existente.idMalha,
        idProdMalha: existente.idProdMalha,
        intMalha: existente.intMalha,
        intProdMalha: existente.intProdMalha,
      };
    });

    return { itemMalhaStatus };
  }

  async excluirItemEstrutura(idProduto: number, idMalha: number): Promise<ExcluirEstruturaStatus> {
    const produto = this.encontrarProduto(idProduto);
    const indice = produto.itens.findIndex((i) => i.idMalha === idMalha);
    if (indice === -1) {
      throw new Error(`Item de estrutura ${idMalha} não encontrado (fake).`);
    }

    const [item] = produto.itens.splice(indice, 1);

    return {
      idProduto,
      intProduto: produto.ident.intProduto,
      idMalha: item.idMalha,
      intMalha: item.intMalha,
      codStatus: "0",
      descrStatus: "Item da estrutura do produto excluído com sucesso! (fake)",
    };
  }
}

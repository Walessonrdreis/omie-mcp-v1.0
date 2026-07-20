import {
  EstruturaProdutoOmie,
  IEstruturaGateway,
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
        idMalha: 1,
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
  constructor(private readonly estruturas: EstruturaProdutoOmie[] = ESTRUTURAS_FAKE) {}

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
}

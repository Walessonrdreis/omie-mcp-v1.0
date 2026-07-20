import {
  IProdutosGateway,
  ListarProdutosResponse,
  ProdutoOmie,
} from "../../domain/interfaces/produtos-gateway.js";

const PRODUTOS_FAKE: ProdutoOmie[] = [
  {
    codigo_produto: 111,
    codigo: "PROD-001",
    codigo_produto_integracao: "",
    descricao: "Produto Fake 1",
    unidade: "UN",
    valor_unitario: 25,
    inativo: "N",
    codigo_familia: 1,
    descricao_familia: "Família Fake",
  },
  {
    codigo_produto: 222,
    codigo: "PROD-002",
    codigo_produto_integracao: "",
    descricao: "Produto Fake 2",
    unidade: "UN",
    valor_unitario: 50,
    inativo: "N",
    codigo_familia: 1,
    descricao_familia: "Família Fake",
  },
];

/**
 * Implementação em memória de `IProdutosGateway`, sem chamar a Omie real —
 * usada quando `OMIE_MOCK=true`, pra desenvolvimento/testes offline.
 */
export class ProdutosFakeGateway implements IProdutosGateway {
  constructor(private readonly produtos: ProdutoOmie[] = PRODUTOS_FAKE) {}

  async listarProdutosPagina(
    pagina: number,
    registrosPorPagina: number,
    codigoFamilia?: number
  ): Promise<ListarProdutosResponse> {
    const filtrados = codigoFamilia
      ? this.produtos.filter((p) => p.codigo_familia === codigoFamilia)
      : this.produtos;

    const inicio = (pagina - 1) * registrosPorPagina;
    const pagina_de_produtos = filtrados.slice(inicio, inicio + registrosPorPagina);
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / registrosPorPagina));

    return {
      pagina,
      total_de_paginas: totalPaginas,
      registros: pagina_de_produtos.length,
      total_de_registros: filtrados.length,
      produto_servico_cadastro: pagina_de_produtos,
    };
  }

  async consultarProduto(codigoProduto: number): Promise<ProdutoOmie> {
    const produto = this.produtos.find((p) => p.codigo_produto === codigoProduto);
    if (!produto) {
      throw new Error(`Produto de código ${codigoProduto} não encontrado (fake).`);
    }
    return produto;
  }

  async consultarProdutosPorCodigo(
    codigosProduto: number[]
  ): Promise<Map<number, ProdutoOmie>> {
    const codigosUnicos = [...new Set(codigosProduto)];
    const mapa = new Map<number, ProdutoOmie>();
    for (const codigo of codigosUnicos) {
      mapa.set(codigo, await this.consultarProduto(codigo));
    }
    return mapa;
  }
}

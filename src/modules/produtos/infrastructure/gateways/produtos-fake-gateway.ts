import {
  ChaveProduto,
  DadosProdutoParaGravar,
  IProdutosGateway,
  ListarProdutosResponse,
  ProdutoOmie,
  StatusProdutoOmie,
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
  private proximoCodigo = 1000;

  /**
   * Cópia própria por instância (não a constante `PRODUTOS_FAKE` direto) —
   * agora que o fake também cria/altera/exclui, compartilhar o array por
   * referência entre instâncias vazaria estado de um teste pro outro.
   */
  constructor(private readonly produtos: ProdutoOmie[] = PRODUTOS_FAKE.map((p) => ({ ...p }))) {}

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

  async incluirProduto(dados: DadosProdutoParaGravar): Promise<StatusProdutoOmie> {
    const jaExiste = this.produtos.some((p) => p.codigo === dados.codigo);
    if (jaExiste) {
      throw new Error(`Já existe produto com código ${dados.codigo} (fake).`);
    }

    const codigoProduto = this.proximoCodigo++;
    this.produtos.push({
      codigo_produto: codigoProduto,
      codigo: dados.codigo,
      codigo_produto_integracao: dados.codigo_produto_integracao ?? "",
      descricao: dados.descricao,
      unidade: dados.unidade,
      valor_unitario: dados.valor_unitario ?? 0,
      inativo: "N",
      codigo_familia: dados.codigo_familia ?? 0,
    });

    return {
      codigo_produto: codigoProduto,
      codigo_produto_integracao: dados.codigo_produto_integracao ?? "",
      codigo_status: "0",
      descricao_status: "Produto cadastrado com sucesso! (fake)",
    };
  }

  private encontrarIndice(chave: ChaveProduto): number {
    return this.produtos.findIndex(
      (p) =>
        (chave.codigo_produto !== undefined && p.codigo_produto === chave.codigo_produto) ||
        (chave.codigo !== undefined && p.codigo === chave.codigo) ||
        (chave.codigo_produto_integracao !== undefined &&
          p.codigo_produto_integracao === chave.codigo_produto_integracao)
    );
  }

  async alterarProduto(
    chave: ChaveProduto,
    dados: Partial<DadosProdutoParaGravar>
  ): Promise<StatusProdutoOmie> {
    const indice = this.encontrarIndice(chave);
    if (indice === -1) {
      throw new Error(`Produto não encontrado pra alterar (fake): ${JSON.stringify(chave)}`);
    }

    this.produtos[indice] = { ...this.produtos[indice], ...dados };
    const produto = this.produtos[indice];

    return {
      codigo_produto: produto.codigo_produto,
      codigo_produto_integracao: produto.codigo_produto_integracao,
      codigo_status: "0",
      descricao_status: "Produto alterado com sucesso! (fake)",
    };
  }

  async excluirProduto(chave: ChaveProduto): Promise<StatusProdutoOmie> {
    const indice = this.encontrarIndice(chave);
    if (indice === -1) {
      throw new Error(`Produto não encontrado pra excluir (fake): ${JSON.stringify(chave)}`);
    }

    const [produto] = this.produtos.splice(indice, 1);

    return {
      codigo_produto: produto.codigo_produto,
      codigo_produto_integracao: produto.codigo_produto_integracao,
      codigo_status: "0",
      descricao_status: "Produto excluído com sucesso! (fake)",
    };
  }
}

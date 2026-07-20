import { OmieClient } from "../../../../omieClient.js";

export interface ProdutoOmie {
  codigo_produto: number;
  codigo: string;
  codigo_produto_integracao: string;
  descricao: string;
  unidade: string;
  valor_unitario: number;
  inativo: string;
  codigo_familia: number;
  descricao_familia?: string;
}

interface ListarProdutosResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  produto_servico_cadastro: ProdutoOmie[];
}

/**
 * Encapsula o acesso ao cadastro de produtos da Omie. Importante: o campo
 * `quantidade_estoque` que a Omie devolve em `ListarProdutos`/`ConsultarProduto`
 * sempre vem 0 nessa conta — não é uma fonte confiável de estoque, por isso o
 * módulo `produtos` cruza com o `EstoqueOmieGateway` (módulo `estoque`) pra
 * calcular a quantidade/valor real.
 */
export class ProdutosOmieGateway {
  constructor(private readonly client: OmieClient) {}

  async listarProdutosPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarProdutosResponse> {
    return this.client.call<ListarProdutosResponse>({
      resource: "geral/produtos",
      call: "ListarProdutos",
      param: {
        pagina,
        registros_por_pagina: registrosPorPagina,
        apenas_importado_api: "N",
      },
    });
  }

  async consultarProduto(codigoProduto: number): Promise<ProdutoOmie> {
    return this.client.call<ProdutoOmie>({
      resource: "geral/produtos",
      call: "ConsultarProduto",
      param: { codigo_produto: codigoProduto },
    });
  }

  /**
   * Busca vários produtos por código em paralelo, deduplicando. Usado por
   * outros módulos (ex: `producao`) que recebem uma lista de códigos de
   * produto (sem descrição) e precisam enriquecer com o cadastro.
   */
  async consultarProdutosPorCodigo(
    codigosProduto: number[]
  ): Promise<Map<number, ProdutoOmie>> {
    const codigosUnicos = [...new Set(codigosProduto)];
    const produtos = await Promise.all(
      codigosUnicos.map((codigo) => this.consultarProduto(codigo))
    );
    return new Map(produtos.map((p) => [p.codigo_produto, p]));
  }
}

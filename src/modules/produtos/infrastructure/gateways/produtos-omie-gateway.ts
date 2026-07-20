import { OmieClient } from "../../../../omieClient.js";
import { mapWithConcurrency } from "../../../../shared/concurrency.js";

const CONCORRENCIA_MAXIMA = 5;

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
    registrosPorPagina: number,
    codigoFamilia?: number
  ): Promise<ListarProdutosResponse> {
    return this.client.call<ListarProdutosResponse>({
      resource: "geral/produtos",
      call: "ListarProdutos",
      param: {
        pagina,
        registros_por_pagina: registrosPorPagina,
        apenas_importado_api: "N",
        ...(codigoFamilia ? { filtrar_apenas_familia: codigoFamilia } : {}),
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
   * Busca vários produtos por código, deduplicando, com concorrência
   * limitada (ver `mapWithConcurrency` — muitas chamadas simultâneas batem
   * no rate limit da Omie). Usado por outros módulos (ex: `ordemProducao`)
   * que recebem uma lista de códigos de produto (sem descrição) e precisam
   * enriquecer com o cadastro.
   */
  async consultarProdutosPorCodigo(
    codigosProduto: number[]
  ): Promise<Map<number, ProdutoOmie>> {
    const codigosUnicos = [...new Set(codigosProduto)];
    const resultados = await mapWithConcurrency(codigosUnicos, CONCORRENCIA_MAXIMA, (codigo) =>
      this.consultarProduto(codigo)
    );
    const mapa = new Map<number, ProdutoOmie>();
    for (const resultado of resultados) {
      if (resultado.status === "rejected") {
        throw resultado.reason;
      }
      mapa.set(resultado.value.codigo_produto, resultado.value);
    }
    return mapa;
  }
}

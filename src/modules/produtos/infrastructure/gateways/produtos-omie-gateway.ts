import { OmieClient } from "../../../../omieClient.js";
import { mapWithConcurrency } from "../../../../shared/concurrency.js";
import {
  ChaveProduto,
  DadosProdutoParaGravar,
  IProdutosGateway,
  ListarProdutosResponse,
  ProdutoOmie,
  StatusProdutoOmie,
} from "../../domain/interfaces/produtos-gateway.js";

export { ProdutoOmie } from "../../domain/interfaces/produtos-gateway.js";

const CONCORRENCIA_MAXIMA = 5;

/**
 * Encapsula o acesso ao cadastro de produtos da Omie. Importante: o campo
 * `quantidade_estoque` que a Omie devolve em `ListarProdutos`/`ConsultarProduto`
 * sempre vem 0 nessa conta — não é uma fonte confiável de estoque, por isso o
 * módulo `produtos` cruza com o `EstoqueOmieGateway` (módulo `estoque`) pra
 * calcular a quantidade/valor real.
 */
export class ProdutosOmieGateway implements IProdutosGateway {
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

  async incluirProduto(dados: DadosProdutoParaGravar): Promise<StatusProdutoOmie> {
    return this.client.call<StatusProdutoOmie>({
      resource: "geral/produtos",
      call: "IncluirProduto",
      param: { ...dados },
    });
  }

  async alterarProduto(
    chave: ChaveProduto,
    dados: Partial<DadosProdutoParaGravar>
  ): Promise<StatusProdutoOmie> {
    return this.client.call<StatusProdutoOmie>({
      resource: "geral/produtos",
      call: "AlterarProduto",
      param: { ...chave, ...dados },
    });
  }

  async excluirProduto(chave: ChaveProduto): Promise<StatusProdutoOmie> {
    return this.client.call<StatusProdutoOmie>({
      resource: "geral/produtos",
      call: "ExcluirProduto",
      param: { ...chave },
    });
  }
}

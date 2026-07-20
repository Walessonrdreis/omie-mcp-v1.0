import { OmieClient } from "../../../../omieClient.js";

/**
 * Uma posição de estoque de um produto em um local de estoque específico,
 * conforme devolvida pela Omie em `estoque/consulta` / `ListarPosEstoque`.
 */
export interface PosicaoEstoque {
  cCodigo: string;
  cDescricao: string;
  codigo_local_estoque: number;
  fisico: number;
  nCodProd: number;
  nSaldo: number;
  reservado: number;
  nPendente: number;
  /** Custo médio (nCMC) do produto nesse local, usado pra calcular valor em estoque. */
  nCMC: number;
}

interface ListarPosEstoqueResponse {
  nPagina: number;
  nTotPaginas: number;
  nTotRegistros: number;
  produtos: PosicaoEstoque[];
}

const REGISTROS_POR_PAGINA = 500;

/**
 * Encapsula o acesso à API de estoque da Omie. A Omie só expõe posição de
 * estoque por local (paginada, sem filtro por produto) — não existe um
 * endpoint de "estoque total do produto". Esse gateway existe pra isolar essa
 * limitação da API: quem consome (use-cases) não sabe que precisou paginar.
 */
export class EstoqueOmieGateway {
  constructor(private readonly client: OmieClient) {}

  private async listarPosEstoquePagina(pagina: number): Promise<ListarPosEstoqueResponse> {
    return this.client.call<ListarPosEstoqueResponse>({
      resource: "estoque/consulta",
      call: "ListarPosEstoque",
      param: {
        nPagina: pagina,
        nRegPorPagina: REGISTROS_POR_PAGINA,
        codigo_local_estoque: 0,
      },
    });
  }

  /**
   * Varre TODAS as páginas de posição de estoque (todos os produtos, todos os
   * locais). Base pra qualquer relatório que precise cruzar estoque com outro
   * dado (ex: valor em estoque por produto, no módulo `produtos`).
   */
  async listarTodasPosicoes(): Promise<PosicaoEstoque[]> {
    const posicoes: PosicaoEstoque[] = [];
    let pagina = 1;
    let totalPaginas = 1;

    do {
      const resposta = await this.listarPosEstoquePagina(pagina);
      totalPaginas = resposta.nTotPaginas;
      posicoes.push(...resposta.produtos);
      pagina++;
    } while (pagina <= totalPaginas);

    return posicoes;
  }

  /**
   * Varre todas as páginas de posição de estoque e devolve apenas as
   * posições do produto informado (em todos os locais de estoque).
   */
  async listarPosicoesPorProduto(codigoProduto: number): Promise<PosicaoEstoque[]> {
    const todas = await this.listarTodasPosicoes();
    return todas.filter((p) => p.nCodProd === codigoProduto);
  }
}

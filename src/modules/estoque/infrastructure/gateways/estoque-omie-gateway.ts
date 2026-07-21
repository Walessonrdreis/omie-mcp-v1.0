import { OmieClient } from "../../../../omieClient.js";
import {
  DadosAjusteEstoqueParaGravar,
  IEstoqueGateway,
  PosicaoEstoque,
  StatusAjusteEstoqueOmie,
} from "../../domain/interfaces/estoque-gateway.js";

export { PosicaoEstoque } from "../../domain/interfaces/estoque-gateway.js";

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
export class EstoqueOmieGateway implements IEstoqueGateway {
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

  async listarPosicoesPorProduto(codigoProduto: number): Promise<PosicaoEstoque[]> {
    const todas = await this.listarTodasPosicoes();
    return todas.filter((p) => p.nCodProd === codigoProduto);
  }

  async incluirAjuste(dados: DadosAjusteEstoqueParaGravar): Promise<StatusAjusteEstoqueOmie> {
    return this.client.call<StatusAjusteEstoqueOmie>({
      resource: "estoque/ajuste",
      call: "IncluirAjusteEstoque",
      param: { ...dados },
    });
  }

  /**
   * Atenção: excluir o ajuste não desfaz a dependência criada no produto — a
   * Omie mantém um "Movimento de Estoque (calculado)" permanente, que passa a
   * bloquear `ExcluirProduto` pra sempre (testado ao vivo). Avise o usuário
   * antes de ajustar estoque de um produto que ele possa querer excluir depois.
   */
  async excluirAjuste(idAjuste: number): Promise<StatusAjusteEstoqueOmie> {
    return this.client.call<StatusAjusteEstoqueOmie>({
      resource: "estoque/ajuste",
      call: "ExcluirAjusteEstoque",
      param: { id_ajuste: idAjuste },
    });
  }
}

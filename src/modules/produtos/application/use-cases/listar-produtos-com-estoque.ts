import { IEstoqueGateway } from "../../../estoque/domain/interfaces/estoque-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import { IProdutosGateway } from "../../domain/interfaces/produtos-gateway.js";
import {
  ListarProdutosComEstoqueParam,
  ListarProdutosComEstoqueResult,
  ProdutoComEstoque,
} from "../dto/listar-produtos-com-estoque.dto.js";

/**
 * A Omie não entrega "produtos com valor em estoque" pronto: o cadastro de
 * produtos não tem estoque confiável (`quantidade_estoque` sempre 0 nessa
 * conta) e a posição de estoque não tem o cadastro do produto — são dois
 * endpoints, sem relação entre si na resposta. Esse use-case cruza os dois:
 * lista os produtos (paginado) e soma a posição de estoque (todos os locais)
 * de cada um, devolvendo quantidade e valor já calculados.
 */
export class ListarProdutosComEstoqueUseCase {
  constructor(
    private readonly produtosGateway: IProdutosGateway,
    private readonly estoqueGateway: IEstoqueGateway
  ) {}

  async execute(param: ListarProdutosComEstoqueParam): Promise<ListarProdutosComEstoqueResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;

    const [produtosResposta, posicoesEstoque] = await Promise.all([
      this.produtosGateway.listarProdutosPagina(
        pagina,
        registrosPorPagina,
        param.filtrar_apenas_familia
      ),
      this.estoqueGateway.listarTodasPosicoes(),
    ]);

    const estoquePorProduto = new Map<number, { quantidade: number; valorCusto: number }>();
    for (const posicao of posicoesEstoque) {
      const atual = estoquePorProduto.get(posicao.nCodProd) ?? { quantidade: 0, valorCusto: 0 };
      atual.quantidade += posicao.fisico;
      atual.valorCusto += posicao.fisico * posicao.nCMC;
      estoquePorProduto.set(posicao.nCodProd, atual);
    }

    let itens: ProdutoComEstoque[] = produtosResposta.produto_servico_cadastro.map((produto) => {
      const estoque = estoquePorProduto.get(produto.codigo_produto) ?? {
        quantidade: 0,
        valorCusto: 0,
      };
      const quantidadeEmEstoque = round2(estoque.quantidade);
      return {
        codigoProduto: produto.codigo_produto,
        codigo: produto.codigo,
        descricao: produto.descricao,
        unidade: produto.unidade,
        quantidadeEmEstoque,
        valorUnitarioVenda: produto.valor_unitario,
        valorEmEstoqueVenda: round2(quantidadeEmEstoque * produto.valor_unitario),
        valorEmEstoqueCusto: round2(estoque.valorCusto),
      };
    });

    if (param.apenas_com_estoque) {
      itens = itens.filter((item) => item.quantidadeEmEstoque !== 0);
    }

    itens = aplicarFiltros(itens, param.filtros);

    return {
      pagina: produtosResposta.pagina,
      totalPaginas: produtosResposta.total_de_paginas,
      totalRegistros: produtosResposta.total_de_registros,
      itens,
    };
  }
}

function round2(valor: number): number {
  return Math.round(valor * 100) / 100;
}

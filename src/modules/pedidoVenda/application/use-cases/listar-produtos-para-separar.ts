import { IPedidoVendaGateway } from "../../domain/interfaces/pedido-venda-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import {
  ItemParaSeparar,
  ListarProdutosParaSepararParam,
  ListarProdutosParaSepararResult,
  ResumoProdutoParaSeparar,
} from "../dto/listar-produtos-para-separar.dto.js";

const ETAPA_SEPARAR_ESTOQUE = "20";

/**
 * A Omie não tem um relatório pronto de "produtos que preciso separar pra
 * despachar pedidos": é preciso listar Pedidos de Venda filtrando pela etapa
 * "Separar Estoque" (catálogo fixo, código "20" pra Venda de Produto — ver
 * ListarEtapasFaturamento), E cruzar com `infoCadastro.cancelado`, porque um
 * pedido cancelado NÃO tem a etapa resetada pela Omie (fica "preso" em
 * Separar Estoque mesmo cancelado). Esse use-case filtra os dois campos e já
 * devolve, por item de pedido, o produto (Omie já traz descrição/SKU dentro
 * de cada item — não precisa cruzar com o módulo `produtos`), além de um
 * resumo agregado por produto (quanto separar no total, de quantos pedidos).
 */
export class ListarProdutosParaSepararUseCase {
  constructor(private readonly gateway: IPedidoVendaGateway) {}

  async execute(param: ListarProdutosParaSepararParam): Promise<ListarProdutosParaSepararResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 20;
    const etapaCodigo = param.etapa_codigo ?? ETAPA_SEPARAR_ESTOQUE;

    const [pedidosResposta, etapaDescricao] = await Promise.all([
      this.gateway.listarPedidosPagina(pagina, registrosPorPagina, etapaCodigo),
      this.gateway.descreverEtapaVendaProduto(etapaCodigo),
    ]);

    const pedidosAtivos = pedidosResposta.pedido_venda_produto.filter(
      (pedido) => pedido.infoCadastro.cancelado !== "S"
    );

    let itens: ItemParaSeparar[] = pedidosAtivos.flatMap((pedido) =>
      pedido.det.map((item) => ({
        numeroPedido: pedido.cabecalho.numero_pedido,
        codigoPedido: pedido.cabecalho.codigo_pedido,
        codigoCliente: pedido.cabecalho.codigo_cliente,
        dataPrevisao: pedido.cabecalho.data_previsao,
        codigoProduto: item.produto.codigo_produto,
        codigoSku: item.produto.codigo,
        descricaoProduto: item.produto.descricao,
        quantidade: item.produto.quantidade,
        unidade: item.produto.unidade,
      }))
    );

    itens = aplicarFiltros(itens, param.filtros);

    const resumoPorProdutoMap = new Map<number, ResumoProdutoParaSeparar>();
    for (const item of itens) {
      const atual = resumoPorProdutoMap.get(item.codigoProduto) ?? {
        codigoProduto: item.codigoProduto,
        codigoSku: item.codigoSku,
        descricaoProduto: item.descricaoProduto,
        quantidadeTotalASeparar: 0,
        emQuantosPedidos: 0,
      };
      atual.quantidadeTotalASeparar += item.quantidade;
      atual.emQuantosPedidos += 1;
      resumoPorProdutoMap.set(item.codigoProduto, atual);
    }

    return {
      pagina: pedidosResposta.pagina,
      totalPaginas: pedidosResposta.total_de_paginas,
      totalRegistros: pedidosResposta.total_de_registros,
      etapaCodigo,
      etapaDescricao,
      itens,
      resumoPorProduto: [...resumoPorProdutoMap.values()].sort(
        (a, b) => b.quantidadeTotalASeparar - a.quantidadeTotalASeparar
      ),
    };
  }
}

import {
  IPedidoCompraGateway,
  ListarPedidosCompraPageParams,
  ListarPedidosCompraResponse,
  PedidoCompraOmie,
  PedidoCompraParaAlterar,
  PedidoCompraParaIncluir,
  StatusPedidoCompra,
} from "../../domain/interfaces/pedido-compra-gateway.js";

/**
 * Implementação em memória de `IPedidoCompraGateway`, sem chamar a Omie
 * real — usada quando `OMIE_MOCK=true`, pra desenvolvimento/testes offline.
 */
export class PedidoCompraFakeGateway implements IPedidoCompraGateway {
  private proximoCodigo = 8000;
  private readonly pedidos = new Map<number, PedidoCompraOmie>();

  async incluirPedido(dados: PedidoCompraParaIncluir): Promise<StatusPedidoCompra> {
    const codigoPedido = this.proximoCodigo++;

    this.pedidos.set(codigoPedido, {
      cabecalho_consulta: {
        nCodPed: codigoPedido,
        cCodIntPed: dados.codIntPed,
        cNumero: String(codigoPedido),
        dDtPrevisao: dados.dataPrevisao,
        nQtdeParc: dados.quantidadeParcelas,
        nCodFor: dados.codigoFornecedor,
        nCodCC: dados.codigoContaCorrente,
        cCodCateg: dados.codigoCategoria ?? "",
        cEtapa: "10",
      },
      produtos_consulta: dados.itens.map((item) => ({
        cCodIntItem: item.codIntItem,
        nCodProd: item.codProduto,
        cDescricao: "",
        nQtde: item.quantidade,
        nValUnit: item.valorUnitario,
        nValTot: item.quantidade * item.valorUnitario,
        nQtdeRec: 0,
      })),
    });

    return {
      codigoPedido,
      codIntPed: dados.codIntPed,
      codigoStatus: "0",
      descricaoStatus: "Pedido de compra incluído com sucesso. (fake)",
      numero: String(codigoPedido),
    };
  }

  private encontrarPedido(codigoPedido: number): PedidoCompraOmie {
    const pedido = this.pedidos.get(codigoPedido);
    if (!pedido) throw new Error(`Pedido de compra ${codigoPedido} não encontrado (fake).`);
    return pedido;
  }

  async alterarPedido(dados: PedidoCompraParaAlterar): Promise<StatusPedidoCompra> {
    const pedido = this.encontrarPedido(dados.codigoPedido);

    if (dados.quantidadeParcelas !== undefined) {
      pedido.cabecalho_consulta.nQtdeParc = dados.quantidadeParcelas;
    }
    if (dados.itens) {
      pedido.produtos_consulta = dados.itens.map((item) => ({
        cCodIntItem: item.codIntItem,
        nCodProd: item.codProduto,
        cDescricao: "",
        nQtde: item.quantidade,
        nValUnit: item.valorUnitario,
        nValTot: item.quantidade * item.valorUnitario,
        nQtdeRec: 0,
      }));
    }

    return {
      codigoPedido: pedido.cabecalho_consulta.nCodPed,
      codIntPed: pedido.cabecalho_consulta.cCodIntPed,
      codigoStatus: "0",
      descricaoStatus: "Pedido de compra alterado com sucesso. (fake)",
      numero: pedido.cabecalho_consulta.cNumero,
    };
  }

  async excluirPedido(codigoPedido: number): Promise<StatusPedidoCompra> {
    const pedido = this.encontrarPedido(codigoPedido);
    this.pedidos.delete(codigoPedido);

    return {
      codigoPedido: pedido.cabecalho_consulta.nCodPed,
      codIntPed: pedido.cabecalho_consulta.cCodIntPed,
      codigoStatus: "0",
      descricaoStatus: "Pedido de compra excluído com sucesso. (fake)",
    };
  }

  async consultarPedido(codigoPedido: number): Promise<PedidoCompraOmie> {
    return this.encontrarPedido(codigoPedido);
  }

  async listarPedidosPagina(
    params: ListarPedidosCompraPageParams
  ): Promise<ListarPedidosCompraResponse> {
    const todos = Array.from(this.pedidos.values());
    const inicio = (params.pagina - 1) * params.registrosPorPagina;
    const pagina = todos.slice(inicio, inicio + params.registrosPorPagina);

    return {
      nTotalPaginas: Math.max(1, Math.ceil(todos.length / params.registrosPorPagina)),
      nTotalRegistros: todos.length,
      pedidos_pesquisa: pagina,
    };
  }
}
